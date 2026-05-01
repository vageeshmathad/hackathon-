import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

def main():
    print("Loading data for visualization...")
    df = pd.read_csv(r"E:\HACKATHON\final_dataset_with_place.csv")
    
    # Create static directory for backend
    output_dir = r"E:\HACKATHON\backend\static"
    os.makedirs(output_dir, exist_ok=True)
    
    # Apply a modern style
    plt.style.use('dark_background')
    
    # 1. Flood Distribution
    print("Generating flood distribution plot...")
    plt.figure(figsize=(8, 6))
    sns.countplot(data=df, x='flood', palette='viridis')
    plt.title('Flood Occurrence Distribution', fontsize=16)
    plt.xlabel('Flood (0 = No, 1 = Yes)', fontsize=12)
    plt.ylabel('Count', fontsize=12)
    plt.savefig(os.path.join(output_dir, 'flood_distribution.png'), bbox_inches='tight', transparent=True)
    plt.close()
    
    # 2. Place vs Flood Count
    print("Generating place vs flood plot...")
    plt.figure(figsize=(10, 6))
    sns.countplot(data=df, x='place', hue='flood', palette='magma')
    plt.title('Flood Occurrences by Place', fontsize=16)
    plt.xlabel('Place', fontsize=12)
    plt.ylabel('Count', fontsize=12)
    plt.xticks(rotation=45)
    plt.savefig(os.path.join(output_dir, 'place_vs_flood.png'), bbox_inches='tight', transparent=True)
    plt.close()
    
    # 3. Correlation Heatmap (excluding 'place' since it's categorical)
    print("Generating correlation heatmap...")
    plt.figure(figsize=(8, 6))
    numeric_df = df[['monsoonintensity', 'urbanization', 'topographydrainage', 'flood']]
    corr = numeric_df.corr()
    sns.heatmap(corr, annot=True, cmap='coolwarm', fmt=".2f", linewidths=.5)
    plt.title('Feature Correlation Heatmap', fontsize=16)
    plt.savefig(os.path.join(output_dir, 'correlation_heatmap.png'), bbox_inches='tight', transparent=True)
    plt.close()
    
    print(f"Visualizations saved to {output_dir}")

if __name__ == "__main__":
    main()
