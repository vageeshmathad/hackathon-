import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import os

def main():
    print("Loading data...")
    df = pd.read_csv(r"E:\HACKATHON\final_dataset_with_place.csv")
    
    # Preprocessing
    print("Preprocessing data...")
    le = LabelEncoder()
    df['place_encoded'] = le.fit_transform(df['place'])
    
    # Define features and target
    features = ['place_encoded', 'monsoonintensity', 'urbanization', 'topographydrainage']
    X = df[features]
    y = df['flood']
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train Model (Optimized to be under 25MB for GitHub)
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=25, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {acc:.4f}")
    print("Classification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save Model and Encoder
    print("Saving model and encoder...")
    os.makedirs(r"E:\HACKATHON\model", exist_ok=True)
    joblib.dump(model, r"E:\HACKATHON\model\flood_model.pkl")
    joblib.dump(le, r"E:\HACKATHON\model\label_encoder.pkl")
    print("Saved successfully to E:\HACKATHON\model")

if __name__ == "__main__":
    main()
