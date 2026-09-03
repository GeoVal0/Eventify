"""
Evaluation of BiasedMatrixFactorization (recommender.py) on the dataset
provided for the assignment (rel_event_csvs/ - this is the "Event
Recommendation Engine Challenge" dataset).

Unlike recommender_demo.py (a synthetic dataset with a *known* ground
truth, used to prove the algorithm's mechanics are correct), this script
is a standard held-out train/test evaluation on real data: split the real
(user, event, rating) signal 80/20, train only on the 80%, and measure how
well the model predicts the 20% it never saw. This is the evaluation
methodology used in the actual recommender-systems literature (e.g. the
Netflix Prize), and is the right way to demonstrate the implementation
works on real-world data, not just on data we constructed to make it work.

DATA -> RATINGS MAPPING
------------------------
event_interest.csv has explicit signal: a user marked an event
'interested' or 'not_interested' (mutually exclusive). This maps directly
onto the same 1-5-ish scale used elsewhere in this project:

    interested = 1      -> rating 5.0  (same BOOKING_SIGNAL used for the
                                         live app's real bookings)
    not_interested = 1  -> rating 1.0  (a genuine LOW rating - the live
                                         app has no equivalent negative
                                         signal, so this dataset actually
                                         exercises a part of the algorithm
                                         our own usage data doesn't reach)

Rows where neither flag is set (no explicit response) are dropped rather
than guessed at - same principle as everywhere else in this project: only
observed signal enters training, nothing is invented.
"""
import csv
import numpy as np
from recommender import BiasedMatrixFactorization

DATA_PATH = "/home/claude/dataset/rel_event_csvs/event_interest.csv"
RNG = np.random.RandomState(42)
TEST_FRACTION = 0.2

POSITIVE_RATING = 5.0
NEGATIVE_RATING = 1.0


def load_ratings(path):
    ratings = []  # (user_id, event_id, rating)
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if not row["event"]:
                continue  # a handful of rows have no event id at all - unusable
            user_id = row["user"]
            event_id = row["event"]
            interested = row["interested"] == "1"
            not_interested = row["not_interested"] == "1"
            if interested:
                ratings.append((user_id, event_id, POSITIVE_RATING))
            elif not_interested:
                ratings.append((user_id, event_id, NEGATIVE_RATING))
            # else: no explicit response - dropped, not guessed at
    return ratings


ratings = load_ratings(DATA_PATH)
print(f"Loaded {len(ratings)} explicit-signal rows from event_interest.csv "
      f"({sum(1 for *_, r in ratings if r == POSITIVE_RATING)} interested, "
      f"{sum(1 for *_, r in ratings if r == NEGATIVE_RATING)} not_interested)")

# --- train/test split (random, since timestamps mark when a candidate
# list was shown, not per-event response time - see module docstring) ---
RNG.shuffle(ratings)
split_point = int(len(ratings) * (1 - TEST_FRACTION))
train_rows, test_rows = ratings[:split_point], ratings[split_point:]
print(f"Split: {len(train_rows)} train / {len(test_rows)} test ({TEST_FRACTION:.0%} held out)\n")

# --- build dense indices from the TRAIN set only (test users/events not
# seen during training get no learned embedding, exactly like a real
# brand-new user - predictions for them fall back to mu, same as the
# live app's cold-start handling) ---
train_user_ids = sorted({u for u, _, _ in train_rows})
train_event_ids = sorted({e for _, e, _ in train_rows})
user_to_idx = {u: i for i, u in enumerate(train_user_ids)}
event_to_idx = {e: i for i, e in enumerate(train_event_ids)}

train_interactions = [(user_to_idx[u], event_to_idx[e], r) for u, e, r in train_rows]

n_users, n_items = len(user_to_idx), len(event_to_idx)
print(f"Training on {n_users} users x {n_items} events "
      f"({len(train_interactions) / (n_users * n_items):.3%} of the matrix observed)\n")

model = BiasedMatrixFactorization(n_factors=20, n_epochs=100, learning_rate=0.01, regularization=0.08)
model.fit(train_interactions, n_users=n_users, n_items=n_items)

print("Training RMSE by epoch (every 20th):")
for epoch in range(0, len(model.train_rmse_history), 20):
    print(f"  epoch {epoch:>3}: {model.train_rmse_history[epoch]:.4f}")
print(f"  final:        {model.train_rmse_history[-1]:.4f}\n")

# --- evaluate on the held-out test set ---
# Test rows whose user or event never appeared in training get mu as their
# prediction (both baselines below do the equivalent - fair comparison).
sq_err_model, sq_err_global, sq_err_user_mean = [], [], []
train_user_means = {}
for u, e, r in train_rows:
    train_user_means.setdefault(u, []).append(r)
train_user_means = {u: np.mean(rs) for u, rs in train_user_means.items()}

for u, e, r in test_rows:
    u_idx, e_idx = user_to_idx.get(u), event_to_idx.get(e)
    if u_idx is not None and e_idx is not None:
        pred = model.predict(u_idx, e_idx)
    elif u_idx is not None:
        pred = model.mu + model.b_u[u_idx]
    else:
        pred = model.mu
    sq_err_model.append((r - pred) ** 2)
    sq_err_global.append((r - model.mu) ** 2)
    sq_err_user_mean.append((r - train_user_means.get(u, model.mu)) ** 2)

rmse_model = float(np.sqrt(np.mean(sq_err_model)))
rmse_global = float(np.sqrt(np.mean(sq_err_global)))
rmse_user_mean = float(np.sqrt(np.mean(sq_err_user_mean)))

print(f"HELD-OUT TEST SET RESULTS ({len(test_rows)} examples the model never trained on):")
print(f"  Global-mean baseline (always predict mu={model.mu:.3f}):        RMSE = {rmse_global:.4f}")
print(f"  Per-user-mean baseline (predict each user's own avg rating):  RMSE = {rmse_user_mean:.4f}")
print(f"  Trained Biased Matrix Factorization model:                    RMSE = {rmse_model:.4f}")
print(f"  -> beats global-mean baseline by {(1 - rmse_model/rmse_global)*100:.1f}%")
print(f"  -> beats per-user-mean baseline by {(1 - rmse_model/rmse_user_mean)*100:.1f}%\n")

# --- pairwise ranking check: for users with BOTH an interested and a
# not_interested example in the test set, does the model correctly score
# the interested one higher? (only meaningful for users who have both -
# report exactly how many that is, no cherry-picking) ---
test_pos_by_user, test_neg_by_user = {}, {}
for u, e, r in test_rows:
    (test_pos_by_user if r == POSITIVE_RATING else test_neg_by_user).setdefault(u, []).append(e)

both_users = set(test_pos_by_user) & set(test_neg_by_user)
correct, total = 0, 0
for u in both_users:
    u_idx = user_to_idx.get(u)
    if u_idx is None:
        continue
    pos_events = [e for e in test_pos_by_user[u] if e in event_to_idx]
    neg_events = [e for e in test_neg_by_user[u] if e in event_to_idx]
    if not pos_events or not neg_events:
        continue
    mean_pos = np.mean([model.predict(u_idx, event_to_idx[e]) for e in pos_events])
    mean_neg = np.mean([model.predict(u_idx, event_to_idx[e]) for e in neg_events])
    total += 1
    correct += int(mean_pos > mean_neg)

print(f"Pairwise ranking check (users with BOTH an 'interested' and a 'not_interested' "
      f"event in the test set): {correct}/{total} correctly ranked interested above not_interested "
      f"({correct/total:.0%})" if total else "No test users qualified for the strict held-out pairwise "
      f"check (need both a positive AND negative example for the same user landing in the SAME 20% test "
      f"split - with only 108 such users total in the whole dataset, that's a small pool to begin with).")

# --- supplementary, larger-N pairwise check ---
# The strict version above only counts a user if both their positive AND
# negative example happened to land in the test split - with just 108
# such users in the whole dataset, a random 80/20 split can easily leave
# very few (here: 1) in that exact overlap. To get a statistically
# meaningful sample size for "does the model separate this user's likes
# from dislikes at all", this version uses every user who has both an
# interested and a not_interested example ANYWHERE in the full dataset,
# scored with the final trained model. This is NOT a clean held-out test
# (some of these examples were in training) - it answers a different,
# narrower question (did the model fit its own training signal in the
# right relative order) rather than "does it generalize to unseen data"
# (which the RMSE figures above already answer properly). Both numbers are
# reported because they're not interchangeable.
print("\nSupplementary check (larger sample, NOT a clean held-out test - see comment above):")
all_pos_by_user, all_neg_by_user = {}, {}
for u, e, r in ratings:
    (all_pos_by_user if r == POSITIVE_RATING else all_neg_by_user).setdefault(u, []).append(e)
all_both_users = set(all_pos_by_user) & set(all_neg_by_user)

correct2, total2 = 0, 0
for u in all_both_users:
    u_idx = user_to_idx.get(u)
    if u_idx is None:
        continue  # user had no training-set signal at all (shouldn't happen if they have both types, but guard)
    pos_events = [e for e in all_pos_by_user[u] if e in event_to_idx]
    neg_events = [e for e in all_neg_by_user[u] if e in event_to_idx]
    if not pos_events or not neg_events:
        continue
    mean_pos = np.mean([model.predict(u_idx, event_to_idx[e]) for e in pos_events])
    mean_neg = np.mean([model.predict(u_idx, event_to_idx[e]) for e in neg_events])
    total2 += 1
    correct2 += int(mean_pos > mean_neg)

print(f"  {correct2}/{total2} users correctly had their interested events scored above their "
      f"not_interested events ({correct2/total2:.0%})" if total2 else "  no qualifying users found")
