"""
Biased Matrix Factorization recommender - implemented from scratch.

Assignment section 13 requires this specific algorithm, built "εκ του
μηδενός" (from scratch) - so this file uses only numpy for arrays/linear
algebra, never a recommender library (no scikit-learn, no `surprise`, no
`implicit`, no LightFM). Every line of the actual learning algorithm below
is ours to explain in the oral exam.

-------------------------------------------------------------------------
THE MODEL
-------------------------------------------------------------------------
For a user u and an event (item) i, we predict a preference score:

    r_hat(u, i) = mu + b_u[u] + b_i[i] + P[u] . Q[i]

    mu    - the global average interaction strength across every observed
            (user, event) signal in the whole system. A single number,
            computed directly from the data (not learned by gradient
            descent - there's nothing to "learn" about a plain average).

    b_u   - one scalar per user: is this particular user generally more
            or less engaged than the average user? (some people book/view
            enthusiastically, others rarely)

    b_i   - one scalar per event: is this particular event generally more
            or less popular than the average event, independent of who's
            looking at it?

    P[u]  - a small vector of K numbers ("latent factors") describing
            user u's taste. K is not chosen by us ahead of time to mean
            anything specific (e.g. "likes music") - the training process
            discovers whatever K numbers best explain the data.

    Q[i]  - a matching K-length vector describing event i's "style" in
            that same learned space.

    P[u] . Q[i] (dot product) - how well this user's taste vector lines
            up with this event's style vector. This is the actual
            personalization term; mu/b_u/b_i alone would just reproduce
            "popular events get recommended to everyone."

This exact formulation (global mean + user bias + item bias + latent
dot-product) is the standard "biased" extension of matrix factorization
from Koren, Bell & Volinsky, "Matrix Factorization Techniques for
Recommender Systems" (IEEE Computer, 2009) - the paper this assignment's
terminology comes from.

-------------------------------------------------------------------------
TURNING BOOKINGS/VIEWS INTO "RATINGS"
-------------------------------------------------------------------------
Classic matrix factorization was designed for explicit 1-5 star ratings.
We don't have star ratings - we have two implicit signals: a booking
(strong intent) and a page view (mild interest). We convert these into a
pseudo-rating on the same 1-5-ish scale so the exact same algorithm
applies unmodified:

    booked an event   -> rating 5.0  (BOOKING_SIGNAL)
    viewed, no booking -> rating 2.0  (VIEW_SIGNAL)

If a user did both for the same event, only the stronger booking signal
is kept (see build_interaction_dataset below). Unobserved (user, event)
pairs are NOT included as "0" - only pairs with an actual signal enter
the training data, which is how this algorithm is meant to work: it's
just as valid mathematically as full explicit ratings.

-------------------------------------------------------------------------
TRAINING: STOCHASTIC GRADIENT DESCENT
-------------------------------------------------------------------------
We fit mu, b_u, b_i, P, Q by minimizing regularized squared error over
every observed (u, i, r) triple:

    minimize   sum_(u,i) (r_ui - r_hat(u,i))^2
             + lambda * ( b_u[u]^2 + b_i[i]^2 + ||P[u]||^2 + ||Q[i]||^2 )

The regularization term (weighted by lambda) discourages the biases and
latent vectors from growing arbitrarily large just to memorize the small
training set - standard defense against overfitting on sparse data.

For each observed triple, the SGD update rule (learning rate gamma) is:

    e          = r_ui - r_hat(u,i)                    # prediction error
    b_u[u]    += gamma * (e            - lambda*b_u[u])
    b_i[i]    += gamma * (e            - lambda*b_i[i])
    P[u]      += gamma * (e * Q[i]     - lambda*P[u])
    Q[i]      += gamma * (e * P[u]     - lambda*Q[i])

(this is the gradient of the loss above, with the constant factor of 2
absorbed into gamma, exactly as in the original paper.)

One correctness detail that's an easy mistake to make: P[u] and Q[i] must
be snapshotted *before* either one is updated, because both update lines
need each other's *old* value. Update Q[i] using the already-updated
P[u] and you've silently changed the algorithm. See the ".copy()" calls
in fit() below.
"""
import numpy as np


BOOKING_SIGNAL = 5.0
VIEW_SIGNAL = 2.0


class BiasedMatrixFactorization:
    """From-scratch biased matrix factorization, trained by SGD. See the
    module docstring above for the full derivation."""

    def __init__(self, n_factors=12, n_epochs=120, learning_rate=0.02,
                 regularization=0.05, random_state=42):
        self.n_factors = n_factors
        self.n_epochs = n_epochs
        self.lr = learning_rate
        self.reg = regularization
        self.random_state = random_state

        # Learned parameters - populated by fit(). Left as None until then
        # so calling predict() before fit() fails loudly instead of
        # silently returning garbage.
        self.mu = None
        self.b_u = None
        self.b_i = None
        self.P = None
        self.Q = None
        self.n_users = 0
        self.n_items = 0

        # Training RMSE per epoch - not needed for predictions, but useful
        # to confirm the optimizer is actually converging (see
        # recommender_demo.py) rather than just "running without crashing."
        self.train_rmse_history = []

    def fit(self, interactions, n_users, n_items):
        """
        interactions: list of (user_idx, item_idx, rating) triples, using
        dense 0-based indices in [0, n_users) and [0, n_items) - NOT raw
        database ids. build_interaction_dataset() below produces exactly
        this, plus the id<->index mappings needed to translate back.
        """
        self.n_users, self.n_items = n_users, n_items
        rng = np.random.RandomState(self.random_state)

        ratings = np.array([r for _, _, r in interactions], dtype=float)
        self.mu = float(ratings.mean()) if len(ratings) else 0.0

        # Small random init - deliberately NOT zeros. If P and Q both
        # started at all-zero, the P[u] update (proportional to Q[i]) and
        # the Q[i] update (proportional to P[u]) would both be zero on
        # every step, and the model could only ever move the bias terms -
        # it would never learn any actual personalization. Randomizing
        # both breaks that symmetry.
        self.P = rng.normal(scale=0.1, size=(n_users, self.n_factors))
        self.Q = rng.normal(scale=0.1, size=(n_items, self.n_factors))
        self.b_u = np.zeros(n_users)
        self.b_i = np.zeros(n_items)

        data = list(interactions)
        self.train_rmse_history = []

        for _epoch in range(self.n_epochs):
            rng.shuffle(data)  # SGD needs randomized sample order each pass
            sq_error_sum = 0.0

            for u, i, r in data:
                pred = self.mu + self.b_u[u] + self.b_i[i] + self.P[u] @ self.Q[i]
                err = r - pred
                sq_error_sum += err * err

                # Snapshot pre-update values - see module docstring on why
                # this matters. self.P[u] is a *view* into the P matrix
                # (numpy basic indexing), not a copy, so without .copy()
                # the "old" variable would mutate the instant we update
                # self.P[u] in place below.
                b_u_old = self.b_u[u]
                b_i_old = self.b_i[i]
                p_u_old = self.P[u].copy()
                q_i_old = self.Q[i].copy()

                self.b_u[u] += self.lr * (err - self.reg * b_u_old)
                self.b_i[i] += self.lr * (err - self.reg * b_i_old)
                self.P[u] += self.lr * (err * q_i_old - self.reg * p_u_old)
                self.Q[i] += self.lr * (err * p_u_old - self.reg * q_i_old)

            rmse = float(np.sqrt(sq_error_sum / max(len(data), 1)))
            self.train_rmse_history.append(rmse)

        return self

    def predict(self, user_idx, item_idx):
        """Single (user, item) prediction."""
        return self.mu + self.b_u[user_idx] + self.b_i[item_idx] + self.P[user_idx] @ self.Q[item_idx]

    def predict_for_user(self, user_idx):
        """Vectorized prediction across every item for one user - this is
        what ranking uses, so it doesn't loop item-by-item in Python."""
        return self.mu + self.b_u[user_idx] + self.b_i + self.Q @ self.P[user_idx]
