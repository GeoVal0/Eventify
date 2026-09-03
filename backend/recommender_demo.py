"""
Correctness demonstration for BiasedMatrixFactorization (recommender.py).

This is NOT part of the running app - it's a standalone script that builds
a synthetic dataset with a *known* answer, trains the model on it, and
checks whether the model actually recovered that structure. Useful for two
things: (1) proving the implementation is correct before trusting it with
real users, and (2) something concrete to walk through in the oral exam,
since "it ran without an error" is a much weaker claim than "it correctly
reconstructed a pattern we know is there."

THE SETUP
---------
16 users split into two hidden preference groups (8 "Genre A fans", 8
"Genre B fans" - the model is never told this grouping). 20 events split
evenly into Genre A and Genre B (also hidden from the model - it only ever
sees plain integer item indices).

Each user rates a *random subset* of their preferred genre's events highly
(5.0) and a *random subset* of the other genre mildly (2.0). Because the
subset is random per user, every user ends up with a handful of own-genre
events they never touched at all.

THE TEST
--------
For each user, look at the own-genre events they never interacted with,
and the cross-genre events they never interacted with. If the model
learned real collaborative structure (not just memorized specific pairs),
its predicted score for the untouched own-genre events should be higher
than for the untouched cross-genre events - purely because *other* same-
genre fans rated those events highly, and this user's latent vector should
have been pulled toward theirs.

This also reports training RMSE (does it converge?) against a trivial
"always predict the global average" baseline (does the model beat doing
nothing clever at all?).
"""
import numpy as np
from recommender import BiasedMatrixFactorization

RNG = np.random.RandomState(7)

N_FANS_PER_GENRE = 8
N_EVENTS_PER_GENRE = 10
OWN_GENRE_SAMPLE = 6   # how many own-genre events each user rates 5.0
OTHER_GENRE_SAMPLE = 2  # how many other-genre events each user rates 2.0

# --- build the synthetic ground truth ---
n_users = N_FANS_PER_GENRE * 2
n_items = N_EVENTS_PER_GENRE * 2
user_genre = (["A"] * N_FANS_PER_GENRE) + (["B"] * N_FANS_PER_GENRE)
item_genre = (["A"] * N_EVENTS_PER_GENRE) + (["B"] * N_EVENTS_PER_GENRE)
a_items = [i for i, g in enumerate(item_genre) if g == "A"]
b_items = [i for i, g in enumerate(item_genre) if g == "B"]

interactions = []
touched = {u: set() for u in range(n_users)}
for u in range(n_users):
    own_items, other_items = (a_items, b_items) if user_genre[u] == "A" else (b_items, a_items)
    own_sample = RNG.choice(own_items, size=OWN_GENRE_SAMPLE, replace=False)
    other_sample = RNG.choice(other_items, size=OTHER_GENRE_SAMPLE, replace=False)
    for it in own_sample:
        interactions.append((u, int(it), 5.0))
        touched[u].add(int(it))
    for it in other_sample:
        interactions.append((u, int(it), 2.0))
        touched[u].add(int(it))

print(f"Synthetic dataset: {n_users} users, {n_items} events, {len(interactions)} observed interactions")
print(f"(sparsity: {len(interactions) / (n_users * n_items):.1%} of the full user x event matrix is observed)\n")

# --- train ---
model = BiasedMatrixFactorization(n_factors=8, n_epochs=150, learning_rate=0.03, regularization=0.05)
model.fit(interactions, n_users=n_users, n_items=n_items)

print("Training RMSE by epoch (every 25th shown):")
for epoch in range(0, len(model.train_rmse_history), 25):
    print(f"  epoch {epoch:>3}: RMSE = {model.train_rmse_history[epoch]:.4f}")
print(f"  epoch {len(model.train_rmse_history)-1:>3}: RMSE = {model.train_rmse_history[-1]:.4f}  (final)")

ratings_arr = np.array([r for _, _, r in interactions])
baseline_rmse = float(np.sqrt(np.mean((ratings_arr - ratings_arr.mean()) ** 2)))
print(f"\nBaseline (always predict the global mean, mu={model.mu:.3f}): RMSE = {baseline_rmse:.4f}")
print(f"Trained model final training RMSE:                          {model.train_rmse_history[-1]:.4f}")
print(f"-> model beats the trivial baseline by {(1 - model.train_rmse_history[-1]/baseline_rmse)*100:.1f}%\n")

# --- the real test: held-out collaborative generalization ---
print("Held-out generalization test (per user, on events they NEVER interacted with):")
print("  For each user, compare predicted score on their untouched own-genre events")
print("  vs untouched other-genre events. A correct model should score own-genre higher,")
print("  purely from collaborative structure (shared taste with other same-genre fans).\n")

correct = 0
for u in range(n_users):
    own_items, other_items = (a_items, b_items) if user_genre[u] == "A" else (b_items, a_items)
    untouched_own = [i for i in own_items if i not in touched[u]]
    untouched_other = [i for i in other_items if i not in touched[u]]
    if not untouched_own or not untouched_other:
        continue  # shouldn't happen given the sampling sizes chosen, but guard anyway

    preds = model.predict_for_user(u)
    mean_own = float(np.mean([preds[i] for i in untouched_own]))
    mean_other = float(np.mean([preds[i] for i in untouched_other]))
    ok = mean_own > mean_other
    correct += int(ok)
    marker = "OK" if ok else "WRONG"
    print(f"  user {u:>2} (genre {user_genre[u]}): untouched own-genre avg={mean_own:+.3f}  "
          f"untouched other-genre avg={mean_other:+.3f}  [{marker}]")

print(f"\nResult: {correct}/{n_users} users correctly ranked their untouched own-genre "
      f"events above untouched other-genre events ({correct/n_users:.0%}).")
