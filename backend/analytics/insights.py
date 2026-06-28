"""Intelligence (Partie 20) : insights calculés depuis les données de l'utilisateur.

- prédiction des dépenses de fin de mois
- détection des abonnements (dépenses récurrentes)
- détection des dépenses inhabituelles
- propositions d'économies
"""
from collections import defaultdict
from datetime import timedelta
from decimal import Decimal

from django.db.models import Avg, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone

from expenses.models import Expense

# Mots-clés indiquant un abonnement (renforcent la détection).
SUBSCRIPTION_KEYWORDS = (
    "netflix", "spotify", "deezer", "amazon prime", "apple", "google",
    "office", "adobe", "canal+", "disney", "youtube", "dropbox", "linkedin",
    "gym", "fitness", "assur", "electricit", "internet", "mobile",
)


def _month_bounds(date):
    """(premier jour du mois, premier jour du mois suivant)."""
    start = date.replace(day=1)
    if date.month == 12:
        end = start.replace(year=date.year + 1, month=1)
    else:
        end = start.replace(month=date.month + 1)
    return start, end


def _prev_month_bounds(date):
    first = date.replace(day=1)
    last_of_prev = first - timedelta(days=1)
    return last_of_prev.replace(day=1), first


def _normalize(text):
    return " ".join((text or "").lower().split())


def predict_month_end(user):
    """Projette la dépense totale de fin de mois selon le rythme actuel."""
    today = timezone.now().date()
    start, end = _month_bounds(today)
    spent = (
        Expense.objects.filter(
            user=user, category__kind="expense", date__gte=start, date__lt=end
        ).aggregate(s=Sum("amount"))["s"]
        or Decimal("0")
    )
    days_elapsed = max((today - start).days + 1, 1)
    days_total = (end - start).days
    daily = spent / Decimal(days_elapsed)
    projected = daily * Decimal(days_total)
    return {
        "spent_so_far": float(spent),
        "projected_total": float(round(projected, 2)),
        "projected_remaining": float(round(projected - spent, 2)),
        "days_elapsed": days_elapsed,
        "days_total": days_total,
    }


def detect_subscriptions(user):
    """Détecte les dépenses récurrentes (>= 2 mois, montants cohérents ou mot-clé)."""
    expenses = (
        Expense.objects.filter(user=user, category__kind="expense")
        .select_related("category")
        .order_by("date")
    )
    groups = defaultdict(list)
    for expense in expenses:
        key = _normalize(expense.description)
        if key:
            groups[key].append(expense)

    subscriptions = []
    for items in groups.values():
        months = {(e.date.year, e.date.month) for e in items}
        if len(months) < 2:
            continue
        amounts = [e.amount for e in items]
        avg = sum(amounts) / len(amounts)
        is_keyword = any(k in items[0].description.lower() for k in SUBSCRIPTION_KEYWORDS)
        is_consistent = avg > 0 and all(abs(a - avg) / avg < 0.15 for a in amounts)
        if not (is_keyword or is_consistent):
            continue
        monthly = float(round(avg, 2))
        subscriptions.append(
            {
                "description": items[0].description,
                "category": items[0].category.name,
                "occurrences": len(items),
                "months": len(months),
                "monthly": monthly,
                "annual": round(monthly * 12, 2),
            }
        )
    subscriptions.sort(key=lambda s: s["monthly"], reverse=True)
    return subscriptions[:12]


def detect_unusual(user):
    """Repère les dépenses du mois largement supérieures à la moyenne de leur catégorie."""
    today = timezone.now().date()
    start, end = _month_bounds(today)
    # Baseline = moyennes des mois PASSÉS (hors mois courant, pour ne pas biaiser
    # la référence par le pic qu'on cherche à détecter).
    averages = Expense.objects.filter(
        user=user, category__kind="expense", date__lt=start
    ).values("category__name").annotate(avg=Avg("amount"))
    avg_map = {a["category__name"]: (a["avg"] or Decimal("0")) for a in averages}

    unusual = []
    for expense in Expense.objects.filter(
        user=user, category__kind="expense", date__gte=start, date__lt=end
    ).select_related("category"):
        avg = avg_map.get(expense.category.name, Decimal("0"))
        if avg > 0 and expense.amount > avg * 2 and expense.amount >= 20:
            unusual.append(
                {
                    "description": expense.description or expense.category.name,
                    "category": expense.category.name,
                    "amount": float(expense.amount),
                    "category_avg": float(round(avg, 2)),
                    "multiplier": float(round(expense.amount / avg, 1)),
                }
            )
    unusual.sort(key=lambda x: x["multiplier"], reverse=True)
    return unusual[:10]


def propose_savings(user):
    """Génère des conseils d'économie concrets à partir des données."""
    tips = []
    today = timezone.now().date()
    start, end = _month_bounds(today)
    prev_start, prev_end = _prev_month_bounds(today)

    month_qs = Expense.objects.filter(
        user=user, category__kind="expense", date__gte=start, date__lt=end
    )
    this_total = month_qs.aggregate(s=Sum("amount"))["s"] or Decimal("0")
    prev_total = (
        Expense.objects.filter(
            user=user, category__kind="expense", date__gte=prev_start, date__lt=prev_end
        ).aggregate(s=Sum("amount"))["s"]
        or Decimal("0")
    )

    # 1) Top catégorie du mois
    top = month_qs.values("category__name").annotate(s=Sum("amount")).order_by("-s").first()
    if top and top["s"]:
        tips.append(
            f"Ta plus grosse dépense ce mois est « {top['category__name']} » "
            f"({float(round(top['s'], 2))} €). C'est le premier poste à optimiser."
        )

    # 2) Abonnements
    subscriptions = detect_subscriptions(user)
    if subscriptions:
        annual = round(sum(s["monthly"] for s in subscriptions) * 12, 2)
        biggest = subscriptions[0]
        tips.append(
            f"Tu as {len(subscriptions)} abonnement(s) récurrent(s) (~{annual} €/an). "
            f"Résilier « {biggest['description']} » t'économiserait {biggest['annual']} €/an."
        )

    # 3) Comparaison vs mois précédent
    if prev_total > 0:
        diff_pct = float((this_total - prev_total) / prev_total * 100)
        if diff_pct > 10:
            tips.append(
                f"Tes dépenses ont augmenté de {round(diff_pct)}% vs le mois dernier. "
                f"Les réduire de 10% t'économiserait {round(float(this_total) * 0.1, 2)} € ce mois-ci."
            )
        elif diff_pct < -10:
            tips.append(
                f"Bravo, tu as dépensé {round(abs(diff_pct))}% de moins que le mois dernier !"
            )

    # 4) Budgets dépassés
    try:
        from budgets.models import Budget

        for budget in Budget.objects.filter(user=user).select_related("category"):
            spent = (
                Expense.objects.filter(
                    user=user,
                    category=budget.category,
                    date__gte=start,
                    date__lt=end,
                ).aggregate(s=Sum("amount"))["s"]
                or Decimal("0")
            )
            if spent > budget.amount:
                tips.append(
                    f"Budget « {budget.category.name} » dépassé : "
                    f"{float(round(spent, 2))} / {float(budget.amount)} €. Revois ce poste."
                )
    except Exception:
        pass

    if not tips:
        tips.append("Ajoute plus de dépenses pour obtenir des conseils personnalisés.")
    return tips


def net_worth_series(user, months=12):
    """Série du patrimoine net cumulé (revenus − dépenses) sur les N derniers mois.

    Renvoie une liste [{month: "YYYY-MM", value: float}] où `value` est le cumul
    net à fin du mois (rempli même pour les mois sans mouvement, pour un
    graphique régulier).
    """
    rows = (
        Expense.objects.filter(user=user)
        .annotate(m=TruncMonth("date"))
        .values("m", "category__kind")
        .annotate(total=Sum("amount"))
        .order_by("m")
    )
    deltas = defaultdict(lambda: Decimal("0"))
    for r in rows:
        total = r["total"] or Decimal("0")
        deltas[r["m"]] += total if r["category__kind"] == "income" else -total

    # Cumul depuis le premier mouvement.
    all_months = sorted(deltas)
    cum = {}
    running = Decimal("0")
    for m in all_months:
        running += deltas[m]
        cum[m] = running

    # N derniers mois calendaires : valeur = dernier cumul connu <= ce mois.
    today = timezone.now().date()
    series = []
    cur = today.replace(day=1)
    for _ in range(months):
        val = Decimal("0")
        for m in all_months:
            if m <= cur:
                val = cum[m]
            else:
                break
        series.append({"month": cur.strftime("%Y-%m"), "value": float(round(val, 2))})
        cur = (cur - timedelta(days=1)).replace(day=1)
    series.reverse()
    return series


def expense_breakdown(user):
    """Répartition des dépenses par catégorie pour le mois courant.

    Renvoie {items: [{name, color, amount, percent}], total}.
    """
    today = timezone.now().date()
    start, end = _month_bounds(today)
    rows = (
        Expense.objects.filter(
            user=user, category__kind="expense", date__gte=start, date__lt=end
        )
        .values("category__name", "category__color")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )
    items = [
        {
            "name": r["category__name"],
            "color": r["category__color"] or "#1ed7ae",
            "amount": float(r["total"] or 0),
        }
        for r in rows
    ]
    total = sum(i["amount"] for i in items)
    for i in items:
        i["percent"] = round(i["amount"] / total * 100, 1) if total else 0
    return {"items": items, "total": round(total, 2)}
