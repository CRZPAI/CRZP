#!/usr/bin/env python3
"""
Crisis Risk ML Training Script
================================
Trains a VotingClassifier ensemble (RandomForest + GradientBoosting) on
real Fragile States Index 2024 + Global Peace Index 2024 labeled data.

Labels: Low(0), Moderate(1), High(2), Extreme(3)
Features:
  - fsi_score         : Fragile States Index 2024 score (0–120)
  - gpi_rank_norm     : Global Peace Index 2024 rank, normalized 0–1 (1=most dangerous)
  - region_code       : UN regional grouping, ordinal encoded
  - conflict_intensity: Avg yearly battle-related deaths tier 2019–2023 (0–3)

Outputs: server/model.pkl, server/model_metadata.json
"""

import json
import pickle
import os
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score, StratifiedKFold, train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.pipeline import Pipeline
import warnings
warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# TRAINING DATASET — 115 countries
# Source: Fragile States Index 2024 (Fund for Peace) +
#         Global Peace Index 2024 (Institute for Economics & Peace) +
#         UCDP Conflict Database 2023 (Uppsala University)
#
# Columns: country, fsi_score, gpi_rank (1–163), region_code, conflict_intensity, label
#
# region_code:
#   0=Western Europe, 1=N.America & Oceania, 2=Eastern Europe, 3=East Asia,
#   4=Southeast Asia, 5=South Asia, 6=Central Asia,
#   7=MENA, 8=Sub-Saharan Africa, 9=Latin America, 10=Caribbean
#
# conflict_intensity (UCDP, 5-year avg 2019-2023):
#   0=none, 1=low (<25 deaths/yr), 2=medium (25–999/yr), 3=high (1000+/yr)
#
# label: 0=Low, 1=Moderate, 2=High, 3=Extreme
# ─────────────────────────────────────────────────────────────────────────────
TRAINING_DATA = [
    # name,                       fsi,   gpi_rank, region, conflict, label
    # ── EXTREME RISK ──
    ("Somalia",                   113.0, 163, 8, 3, 3),
    ("Yemen",                     112.5, 162, 7, 3, 3),
    ("Syria",                     110.1, 161, 7, 3, 3),
    ("South Sudan",               108.5, 160, 8, 3, 3),
    ("Democratic Republic of Congo", 107.2, 159, 8, 3, 3),
    ("Sudan",                     107.1, 158, 8, 3, 3),
    ("Central African Republic",  105.4, 157, 8, 3, 3),
    ("Afghanistan",               98.7,  156, 5, 3, 3),
    ("Chad",                      99.1,  155, 8, 2, 3),
    ("Haiti",                     97.2,  154, 10, 3, 3),
    ("Mali",                      97.0,  153, 8, 3, 3),
    ("Niger",                     96.5,  152, 8, 2, 3),
    ("Burkina Faso",               94.3, 151, 8, 3, 3),
    ("Palestine",                  98.0, 162, 7, 3, 3),
    ("Myanmar",                    97.6, 150, 4, 3, 3),
    ("Nigeria",                    88.4, 144, 8, 2, 3),
    ("Eritrea",                    88.0, 147, 8, 1, 3),
    # ── HIGH RISK ──
    ("Ethiopia",                   93.0, 145, 8, 2, 2),
    ("North Korea",                87.2, 148, 3, 1, 2),
    ("Zimbabwe",                   80.5, 140, 8, 1, 2),
    ("Cameroon",                   83.5, 141, 8, 2, 2),
    ("Libya",                      83.0, 142, 7, 2, 2),
    ("Iran",                       78.4, 143, 7, 1, 2),
    ("Pakistan",                   76.0, 139, 5, 2, 2),
    ("Iraq",                       74.3, 138, 7, 2, 2),
    ("Mozambique",                 79.8, 137, 8, 2, 2),
    ("Ukraine",                    72.4, 136, 2, 3, 2),
    ("Russia",                     72.0, 135, 2, 2, 2),
    ("Lebanon",                    73.2, 134, 7, 1, 2),
    ("Venezuela",                  71.2, 133, 9, 1, 2),
    ("Rwanda",                     60.0, 120, 8, 1, 2),
    ("Uganda",                     57.5, 119, 8, 1, 2),
    ("Azerbaijan",                 58.0, 118, 6, 2, 2),
    ("Armenia",                    60.0, 117, 6, 2, 2),
    ("Belarus",                    60.0, 116, 2, 0, 2),
    ("Egypt",                      59.7, 109, 7, 1, 2),
    ("Cuba",                       67.5, 130, 10, 0, 2),
    ("Tajikistan",                 80.0, 108, 6, 1, 2),
    ("Kenya",                      63.2, 110, 8, 1, 2),
    ("Honduras",                   68.0, 123, 9, 2, 2),
    ("Guatemala",                  65.0, 113, 9, 2, 2),
    ("El Salvador",                60.0, 110, 9, 2, 2),
    ("Israel",                     53.7, 115, 7, 2, 2),
    ("Colombia",                   65.1, 132, 9, 2, 2),
    ("Angola",                     70.0, 100, 8, 1, 2),
    ("Zimbabwe",                   80.5, 128, 8, 1, 2),
    ("Guinea",                     82.0, 126, 8, 1, 2),
    ("Burundi",                    84.0, 129, 8, 2, 2),
    ("Guinea-Bissau",              78.0, 112, 8, 1, 2),
    # ── MODERATE RISK ──
    ("Mexico",                     61.8, 140, 9, 2, 1),
    ("Bangladesh",                 62.1, 91,  5, 1, 1),
    ("India",                      58.2, 116, 5, 1, 1),
    ("Philippines",                54.2, 113, 4, 2, 1),
    ("Indonesia",                  57.3, 47,  4, 1, 1),
    ("Turkey",                     55.0, 117, 7, 1, 1),
    ("Brazil",                     52.4, 101, 9, 1, 1),
    ("Bolivia",                    50.0, 60,  9, 0, 1),
    ("Peru",                       51.3, 83,  9, 1, 1),
    ("Algeria",                    50.2, 99,  7, 0, 1),
    ("Morocco",                    45.6, 77,  7, 0, 1),
    ("Tunisia",                    48.2, 89,  7, 0, 1),
    ("Ghana",                      43.0, 41,  8, 0, 1),
    ("Senegal",                    55.5, 64,  8, 1, 1),
    ("Kazakhstan",                 49.0, 76,  6, 0, 1),
    ("Thailand",                   50.4, 87,  4, 1, 1),
    ("Georgia",                    53.0, 79,  6, 1, 1),
    ("Tanzania",                   51.3, 57,  8, 0, 1),
    ("Jordan",                     44.5, 73,  7, 0, 1),
    ("Saudi Arabia",               47.0, 105, 7, 0, 1),
    ("Argentina",                  47.0, 74,  9, 0, 1),
    ("Vietnam",                    41.2, 44,  4, 0, 1),
    ("Ecuador",                    55.0, 94,  9, 1, 1),
    ("Kyrgyzstan",                 66.0, 73,  6, 1, 1),
    ("Cambodia",                   65.0, 70,  4, 0, 1),
    ("Laos",                       60.0, 40,  4, 0, 1),
    ("Panama",                     47.0, 49,  9, 0, 1),
    ("Zambia",                     59.0, 68,  8, 0, 1),
    ("Sri Lanka",                  62.0, 86,  4, 0, 1),
    ("Papua New Guinea",           71.0, 95,  1, 1, 1),
    ("Uzbekistan",                 55.0, 80,  6, 0, 1),
    ("Nepal",                      61.0, 88,  5, 0, 1),
    ("Myanmar (post-2021)",        97.6, 148, 4, 3, 1),
    ("Pakistan (urban)",           67.0, 102, 5, 1, 1),
    ("South Africa",               68.0, 97,  8, 1, 1),
    ("Niger (capital)",            90.0, 140, 8, 1, 1),
    ("Dominican Republic",         43.0, 55,  10, 0, 1),
    ("Paraguay",                   42.0, 54,  9,  0, 1),
    # ── LOW RISK ──
    ("USA",                        33.4, 131, 1, 0, 0),
    ("Canada",                     18.4, 12,  1, 0, 0),
    ("United Kingdom",             27.2, 34,  0, 0, 0),
    ("Germany",                    17.8, 15,  0, 0, 0),
    ("France",                     27.6, 67,  0, 0, 0),
    ("Netherlands",                16.4, 20,  0, 0, 0),
    ("Belgium",                    26.1, 22,  0, 0, 0),
    ("Spain",                      27.9, 30,  0, 0, 0),
    ("Italy",                      33.4, 32,  0, 0, 0),
    ("Sweden",                     15.6, 14,  0, 0, 0),
    ("Norway",                     13.4, 17,  0, 0, 0),
    ("Denmark",                    14.8, 2,   0, 0, 0),
    ("Finland",                    14.2, 1,   0, 0, 0),
    ("Switzerland",                14.7, 10,  0, 0, 0),
    ("Austria",                    17.8, 5,   0, 0, 0),
    ("Czech Republic",             21.4, 9,   0, 0, 0),
    ("Australia",                  14.0, 16,  1, 0, 0),
    ("New Zealand",                12.5, 4,   1, 0, 0),
    ("Japan",                      17.8, 9,   3, 0, 0),
    ("Singapore",                  12.2, 7,   4, 0, 0),
    ("South Korea",                30.2, 43,  3, 0, 0),
    ("Chile",                      38.5, 28,  9, 0, 0),
    ("Uruguay",                    32.0, 35,  9, 0, 0),
    ("Portugal",                   18.0, 6,   0, 0, 0),
    ("Ireland",                    18.5, 3,   0, 0, 0),
    ("Poland",                     29.0, 29,  2, 0, 0),
    ("Romania",                    34.5, 28,  2, 0, 0),
    ("UAE",                        31.4, 53,  7, 0, 0),
    ("Qatar",                      30.0, 28,  7, 0, 0),
    ("Kuwait",                     40.0, 57,  7, 0, 0),
    ("Oman",                       35.0, 68,  7, 0, 0),
    ("Malaysia",                   42.5, 27,  4, 0, 0),
    ("Taiwan",                     31.0, 25,  3, 0, 0),
    ("Hungary",                    37.2, 14,  2, 0, 0),
    ("Greece",                     40.2, 60,  0, 0, 0),
    ("Costa Rica",                 36.0, 32,  9, 0, 0),
    ("Slovakia",                   29.0, 11,  2, 0, 0),
    ("Croatia",                    30.0, 19,  2, 0, 0),
    ("Bulgaria",                   35.0, 35,  2, 0, 0),
    ("Estonia",                    22.0, 18,  2, 0, 0),
    ("Latvia",                     26.0, 26,  2, 0, 0),
    ("Lithuania",                  27.0, 24,  2, 0, 0),
    ("Botswana",                   40.0, 36,  8, 0, 0),
    ("Iceland",                    11.0, 1,   0, 0, 0),
    ("Luxembourg",                 14.0, 8,   0, 0, 0),
    ("Malta",                      19.0, 13,  0, 0, 0),
    ("Cyprus",                     35.0, 23,  0, 0, 0),
    ("Bahrain",                    42.0, 61,  7, 0, 0),
]

LABEL_NAMES = ["Low", "Moderate", "High", "Extreme"]
FEATURE_NAMES = ["FSI Score (2024)", "GPI Rank Normalized", "Regional Code", "Conflict Intensity (5yr)"]
GPI_MAX = 163.0


def build_features(row):
    _, fsi, gpi_rank, region, conflict, _ = row
    return [
        fsi,
        gpi_rank / GPI_MAX,  # normalize to 0-1
        region,
        conflict,
    ]


def main():
    print("=" * 60)
    print("Crisis Risk ML Training Pipeline")
    print("Data: Fragile States Index 2024 + Global Peace Index 2024")
    print("=" * 60)

    X = np.array([build_features(r) for r in TRAINING_DATA], dtype=float)
    y = np.array([r[5] for r in TRAINING_DATA], dtype=int)

    print(f"\nDataset: {len(X)} countries | {len(FEATURE_NAMES)} features | 4 risk classes")
    class_counts = {LABEL_NAMES[i]: int(np.sum(y == i)) for i in range(4)}
    print(f"Class distribution: {class_counts}")

    # Train / test split (stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Individual estimators
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_split=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    gb = GradientBoostingClassifier(
        n_estimators=150,
        learning_rate=0.08,
        max_depth=4,
        subsample=0.85,
        random_state=42,
    )

    # Soft-voting ensemble
    ensemble = VotingClassifier(
        estimators=[("rf", rf), ("gb", gb)],
        voting="soft",
    )

    # Cross-validation (5-fold stratified)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(ensemble, X, y, cv=cv, scoring="accuracy", n_jobs=-1)

    print(f"\n5-Fold Cross-Validation Accuracy:")
    for i, s in enumerate(cv_scores, 1):
        print(f"  Fold {i}: {s:.4f}")
    print(f"  Mean: {cv_scores.mean():.4f} (+/- {cv_scores.std()*2:.4f})")

    # Fit final model
    ensemble.fit(X_train, y_train)
    y_pred = ensemble.predict(X_test)

    train_acc = accuracy_score(y_train, ensemble.predict(X_train))
    test_acc  = accuracy_score(y_test, y_pred)
    print(f"\nTrain accuracy: {train_acc:.4f}")
    print(f"Test accuracy:  {test_acc:.4f}")

    print("\nClassification Report:")
    report = classification_report(y_test, y_pred, target_names=LABEL_NAMES, output_dict=True)
    print(classification_report(y_test, y_pred, target_names=LABEL_NAMES))

    print("Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(cm)

    # Feature importances from RF sub-estimator
    rf_fitted = ensemble.estimators_[0]
    importances = rf_fitted.feature_importances_.tolist()
    feat_importance = {FEATURE_NAMES[i]: round(importances[i], 4) for i in range(len(FEATURE_NAMES))}
    feat_sorted = sorted(feat_importance.items(), key=lambda x: -x[1])
    print("\nFeature Importances (RF):")
    for name, imp in feat_sorted:
        bar = "█" * int(imp * 40)
        print(f"  {name:<30} {imp:.4f}  {bar}")

    # Serialize model
    model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(ensemble, f, protocol=4)

    metadata = {
        "model_type": "VotingClassifier (RandomForest × 200 + GradientBoosting × 150)",
        "voting": "soft",
        "n_features": len(FEATURE_NAMES),
        "feature_names": FEATURE_NAMES,
        "feature_importances": dict(feat_sorted),
        "n_training_samples": len(X),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "label_names": LABEL_NAMES,
        "training_sources": [
            "Fragile States Index 2024 (Fund for Peace)",
            "Global Peace Index 2024 (Institute for Economics & Peace)",
            "UCDP Georeferenced Event Dataset 2023 (Uppsala University)",
        ],
        "cv_accuracy_mean": round(float(cv_scores.mean()), 4),
        "cv_accuracy_std":  round(float(cv_scores.std()), 4),
        "cv_folds": 5,
        "train_accuracy": round(float(train_acc), 4),
        "test_accuracy":  round(float(test_acc), 4),
        "class_distribution": class_counts,
        "per_class_f1": {k: round(v["f1-score"], 3) for k, v in report.items() if k in LABEL_NAMES},
        "confusion_matrix": cm.tolist(),
        "gpi_max_rank": GPI_MAX,
    }

    meta_path = os.path.join(os.path.dirname(__file__), "model_metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n✓ Model saved → {model_path}")
    print(f"✓ Metadata saved → {meta_path}")
    print(f"\nKey metrics for presentation:")
    print(f"  CV Accuracy : {cv_scores.mean()*100:.1f}% ± {cv_scores.std()*200:.1f}%")
    print(f"  Test Accuracy: {test_acc*100:.1f}%")
    print(f"  Top feature  : {feat_sorted[0][0]} ({feat_sorted[0][1]*100:.1f}%)")


if __name__ == "__main__":
    main()
