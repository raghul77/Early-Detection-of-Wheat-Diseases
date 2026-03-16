import os
import io  
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import hashlib
from dotenv import load_dotenv
from sqlalchemy import func
from flask import send_file
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle
from reportlab.lib.units import inch
from chatbot import wheat_chatbot
import tempfile
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend
import matplotlib.pyplot as plt
import pickle
import pandas as pd

load_dotenv()

# -------------------- APP SETUP --------------------
app = Flask(__name__)
CORS(app)

# -------------------- DATABASE SETUP --------------------
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"postgresql://{os.getenv('DB_USER')}:"
    f"{os.getenv('DB_PASSWORD')}@"
    f"{os.getenv('DB_HOST')}:"
    f"{os.getenv('DB_PORT')}/"
    f"{os.getenv('DB_NAME')}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# -------------------- DATABASE MODELS --------------------
class Client(db.Model):
    __tablename__ = 'clients'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    phone = db.Column(db.String(20))

class DiseasePrediction(db.Model):
    __tablename__ = 'disease_predictions'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'))
    disease_name = db.Column(db.String(100), nullable=False)
    confidence = db.Column(db.Float)
    predicted_at = db.Column(db.DateTime, default=datetime.utcnow)
    client = db.relationship('Client', backref='predictions')

class ClientStats(db.Model):
    __tablename__ = 'client_stats'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), unique=True)
    total_scans = db.Column(db.Integer, default=0)
    diseases_detected = db.Column(db.Integer, default=0)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    client = db.relationship('Client', backref='stats')

# Create tables
with app.app_context():
    db.create_all()
    if not Client.query.first():
        default_client = Client(name="Default Farmer", phone="1234567890")
        db.session.add(default_client)
        db.session.commit()
        # Create stats for default client
        default_stats = ClientStats(client_id=default_client.id)
        db.session.add(default_stats)
        db.session.commit()

# -------------------- PATHS --------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "trained_model_efficientnet_b0.h5")

# -------------------- LOAD MODEL --------------------
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("Model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Load fertilizer model
FERTILIZER_MODEL_PATH = os.path.join(BASE_DIR, "fertilizer_recommendation_model.pkl")
fertilizer_model = None

try:
    with open(FERTILIZER_MODEL_PATH, "rb") as f:
        fertilizer_model = pickle.load(f)
    print("✅ Fertilizer model loaded successfully")
except Exception as e:
    print(f"❌ Error loading fertilizer model: {e}")

# -------------------- CLASS NAMES --------------------
CLASS_NAMES = [
    "Aphid",
    "Black Rust",
    "Blast",
    "Brown Rust",
    "Common Root Rot",
    "Fusarium Head Blight",
    "Healthy",
    "Leaf Blight",
    "Mildew",
    "Mite",
    "Septoria",
    "Smut",
    "Stem fly",
    "Tan spot",
    "Yellow Rust"
]


# -------------------- DISEASE SEVERITY --------------------
SEVERITY_MAP = {
    "Aphid": 3,
    "Black Rust": 3,
    "Blast": 3,
    "Brown Rust": 3,
    "Common Root Rot": 2,
    "Fusarium Head Blight": 3,
    "Healthy": 0,
    "Leaf Blight": 2,
    "Mildew": 2,
    "Mite": 2,
    "Septoria": 2,
    "Smut": 3,
    "Stem fly": 2,
    "Tan spot": 2,
    "Yellow Rust": 3,
    "Other Disease": 2
}



# -------------------- DISEASE REMEDIES --------------------
REMEDY_MAP = {

    "Aphid": [
        "Spray Imidacloprid 17.8% SL @ 0.3 ml per litre of water.",
        "Alternatively use Thiamethoxam 25 WG @ 0.2 g per litre.",
        "Encourage natural predators such as lady beetles.",
        "Avoid excessive nitrogen fertilization which attracts aphids.",
        "Regularly monitor the underside of leaves for infestation.",
        "Use yellow sticky traps to monitor aphid population."
    ],

    "Black Rust": [
        "Spray Propiconazole 25 EC @ 1 ml per litre of water.",
        "Apply Tebuconazole 250 EC @ 1 ml per litre if infection spreads.",
        "Remove and destroy infected crop residues after harvest.",
        "Avoid excessive nitrogen fertilizer application.",
        "Plant rust-resistant wheat varieties recommended by local agricultural institutes."
    ],

    "Blast": [
        "Apply Tricyclazole 75 WP @ 0.6 g per litre of water.",
        "Spray Carbendazim 50 WP @ 1 g per litre during early infection.",
        "Avoid high nitrogen fertilization which promotes blast disease.",
        "Maintain proper spacing to improve airflow.",
        "Remove infected plant residues and burn them."
    ],

    "Brown Rust": [
        "Spray Mancozeb 75 WP @ 2 g per litre of water.",
        "Use Propiconazole 25 EC @ 1 ml per litre during severe infection.",
        "Ensure proper field ventilation by maintaining recommended plant spacing.",
        "Use resistant wheat cultivars recommended by agricultural universities.",
        "Monitor weather conditions since rust spreads rapidly in humid climates."
    ],

    "Common Root Rot": [
        "Treat seeds with Carbendazim 2 g per kg seed before sowing.",
        "Apply Trichoderma bio-fungicide to soil to suppress pathogen growth.",
        "Ensure good drainage and avoid waterlogged conditions.",
        "Practice crop rotation with non-cereal crops.",
        "Maintain balanced soil nutrition with adequate potassium."
    ],

    "Fusarium Head Blight": [
        "Spray Tebuconazole 250 EC @ 1 ml per litre at flowering stage.",
        "Avoid overhead irrigation during flowering period.",
        "Use certified disease-free seeds.",
        "Rotate crops with legumes or oilseeds.",
        "Remove infected crop residues from field."
    ],

    "Healthy": [
        "Maintain balanced fertilization based on soil test recommendations.",
        "Apply preventive fungicide sprays during high humidity conditions.",
        "Practice crop rotation to reduce disease pressure.",
        "Regularly monitor crops for early signs of pests or diseases.",
        "Ensure proper irrigation and drainage."
    ],

    "Leaf Blight": [
        "Spray Mancozeb 75 WP @ 2 g per litre of water.",
        "Apply Chlorothalonil 75 WP @ 2 g per litre if disease persists.",
        "Avoid planting wheat after maize to reduce pathogen carryover.",
        "Ensure proper field drainage.",
        "Use resistant wheat varieties recommended for the region."
    ],

    "Mildew": [
        "Spray Sulfur 80 WP @ 2 g per litre of water.",
        "Alternatively use Hexaconazole 5 EC @ 1 ml per litre.",
        "Avoid excessive nitrogen fertilization.",
        "Ensure proper spacing to improve airflow.",
        "Remove infected leaves early to reduce spread."
    ],

    "Mite": [
        "Spray Dicofol 18.5 EC @ 2.5 ml per litre of water.",
        "Alternatively use Abamectin 1.9 EC @ 0.5 ml per litre.",
        "Remove heavily infested leaves.",
        "Maintain field sanitation.",
        "Encourage natural predators such as predatory mites."
    ],

    "Septoria": [
        "Spray Azoxystrobin 250 SC @ 1 ml per litre of water.",
        "Apply Propiconazole 25 EC @ 1 ml per litre if disease spreads.",
        "Use certified disease-free seeds.",
        "Avoid late sowing which increases disease risk.",
        "Ensure proper irrigation management."
    ],

    "Smut": [
        "Treat seeds with Carboxin 75 WP @ 2 g per kg seed.",
        "Use certified treated seeds for sowing.",
        "Practice crop rotation to reduce pathogen survival.",
        "Remove infected plants before spores spread.",
        "Avoid saving seeds from infected fields."
    ],

    "Stem fly": [
        "Spray Chlorpyrifos 20 EC @ 2 ml per litre of water.",
        "Apply Imidacloprid 17.8 SL @ 0.3 ml per litre if infestation increases.",
        "Maintain recommended plant spacing.",
        "Remove infected plants to prevent spread.",
        "Avoid excessive nitrogen fertilization."
    ],

    "Tan spot": [
        "Spray Propiconazole 25 EC @ 1 ml per litre of water.",
        "Apply Mancozeb 75 WP @ 2 g per litre as preventive spray.",
        "Rotate crops with non-host crops such as legumes.",
        "Remove infected plant residues from the field.",
        "Use resistant wheat varieties."
    ],

    "Yellow Rust": [
        "Spray Tebuconazole 250 EC @ 1 ml per litre of water.",
        "Apply Propiconazole 25 EC @ 1 ml per litre during early infection.",
        "Use resistant wheat varieties recommended for your region.",
        "Monitor fields regularly during cool and humid weather.",
        "Avoid excessive nitrogen fertilization."
    ],

    "Other Disease": [
        "Consult a local agricultural expert or extension officer.",
        "Conduct soil and leaf analysis to identify nutrient deficiencies.",
        "Apply broad-spectrum fungicide such as Mancozeb @ 2 g per litre.",
        "Maintain proper crop hygiene and remove infected plants.",
        "Monitor crop health regularly and take preventive measures."
    ]
}

IMG_SIZE = 224

# -------------------- IMAGE PREPROCESSING --------------------
def preprocess_image(image):
    image = image.resize((IMG_SIZE, IMG_SIZE))
    image = np.array(image)
    image = tf.keras.applications.efficientnet.preprocess_input(image)
    image = np.expand_dims(image, axis=0)
    return image

# -------------------- HELPER FUNCTION --------------------
def update_client_stats(client_id, is_disease):
    client_id = int(client_id)
    """Update or create client statistics"""
    stats = ClientStats.query.filter_by(client_id=client_id).first()
    
    if not stats:
        stats = ClientStats(client_id=client_id, total_scans=0, diseases_detected=0)
        db.session.add(stats)
    
    stats.total_scans += 1
    if is_disease:
        stats.diseases_detected += 1
    stats.last_updated = datetime.utcnow()
    
    #db.session.commit()

# -------------------- PREDICTION API --------------------
@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    
    file = request.files["file"]
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    if '.' not in file.filename or file.filename.split('.')[-1].lower() not in allowed_extensions:
        return jsonify({"error": "Invalid file type. Allowed: PNG, JPG, JPEG, GIF"}), 400
    
    client_id = request.form.get("client_id")

    if not client_id:
        return jsonify({"error": "client_id is required"}), 400

    try:
        client_id = int(client_id)
    except ValueError:
        return jsonify({"error": "Invalid client_id"}), 400

    client = Client.query.get(client_id)
    if not client:
        return jsonify({"error": "Client not found"}), 404

    
    try:
        image = Image.open(io.BytesIO(file.read())).convert("RGB")
        
        if image is None:
            return jsonify({"error": "Invalid image file"}), 400
        
        if model is None:
            return jsonify({"error": "Model not loaded"}), 500
        
        img = preprocess_image(image)
        predictions = model.predict(img, verbose=0)
        
        class_index = np.argmax(predictions)
        predicted_disease = CLASS_NAMES[class_index]
        CONFIDENCE_THRESHOLD = 60.0

        confidence = float(np.max(predictions)) * 100
        if confidence < CONFIDENCE_THRESHOLD:
            predicted_disease = "Other Disease"

        
        
        #severity = SEVERITY_MAP.get(predicted_disease, 50)
        severity = SEVERITY_MAP.get(predicted_disease, SEVERITY_MAP["Other Disease"])

        #risk_level = int((confidence * severity) / 100)
        MAX_SEVERITY = 3
        risk_level = round((confidence / 100) * (severity / MAX_SEVERITY) * 100, 2)

        
        remedies = REMEDY_MAP.get(predicted_disease, REMEDY_MAP["Other Disease"])
        
        # Save prediction to database
        prediction_record = DiseasePrediction(
            client_id=client_id,
            disease_name=predicted_disease,
            confidence=confidence,
        )
        db.session.add(prediction_record)
        
        # Update client statistics
        is_disease = predicted_disease != "Healthy"
        update_client_stats(client_id, is_disease)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "diseaseName": predicted_disease,
            "confidenceLevel": round(confidence, 2),
            "riskLevel": risk_level,
            "remedies": remedies,
            "clientId": client_id,
            "clientName": client.name
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

# -------------------- WEEKLY DASHBOARD API --------------------
@app.route("/weekly-dashboard/<int:client_id>", methods=["GET"])
def weekly_dashboard(client_id):
    try:
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        predictions = DiseasePrediction.query.filter(
            DiseasePrediction.client_id == client_id,
            DiseasePrediction.predicted_at >= one_week_ago
        ).all()
        
        dashboard = {}
        for p in predictions:
            dashboard[p.disease_name] = dashboard.get(p.disease_name, 0) + 1
        
        return jsonify(dashboard)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------- DASHBOARD STATISTICS API --------------------
@app.route("/dashboard-stats/<int:client_id>", methods=["GET"])
def dashboard_stats(client_id):
    try:
        # Get client statistics
        stats = ClientStats.query.filter_by(client_id=client_id).first()
        
        if not stats:
            stats = ClientStats(client_id=client_id, total_scans=0, diseases_detected=0)
            db.session.add(stats)
            db.session.commit()
        
        # Calculate weekly average confidence
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        weekly_predictions = DiseasePrediction.query.filter(
            DiseasePrediction.client_id == client_id,
            DiseasePrediction.predicted_at >= one_week_ago
        ).all()
        
        if weekly_predictions:
            avg_confidence = sum(p.confidence for p in weekly_predictions) / len(weekly_predictions)
        else:
            avg_confidence = 0
        
        # Calculate health index (percentage of healthy scans)
        if stats.total_scans > 0:
            health_index = ((stats.total_scans - stats.diseases_detected) / stats.total_scans) * 100
        else:
            health_index = 100
        
        # Calculate average risk level for the week
        if weekly_predictions:
            avg_risk = sum(
                (p.confidence * SEVERITY_MAP.get(p.disease_name, 50)) / 100 
                for p in weekly_predictions
            ) / len(weekly_predictions)
        else:
            avg_risk = 0
        
        # Calculate success rate (based on confidence levels)
        if weekly_predictions:
            high_confidence_count = sum(1 for p in weekly_predictions if p.confidence >= 85)
            success_rate = (high_confidence_count / len(weekly_predictions)) * 100
        else:
            success_rate = 0
        
        return jsonify({
            "totalScans": stats.total_scans,
            "diseasesDetected": stats.diseases_detected,
            "avgConfidence": round(avg_confidence, 2),
            "healthIndex": round(health_index, 2),
            "avgRiskLevel": round(avg_risk, 2),
            "successRate": round(success_rate, 2),
            "fieldsMonitored": 2  # Static value, can be made dynamic later
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

# -------------------- PDF REPORT GENERATION --------------------
@app.route("/download-report/<int:client_id>", methods=["GET"])
def download_report(client_id):
    client = Client.query.get(client_id)
    if not client:
        return jsonify({"error": "Client not found"}), 404

    stats = ClientStats.query.filter_by(client_id=client_id).first()
    one_week_ago = datetime.utcnow() - timedelta(days=7)
    
    # Get weekly data
    weekly_data = db.session.query(
        DiseasePrediction.disease_name,
        func.count(DiseasePrediction.id).label('count')
    ).filter(
        DiseasePrediction.client_id == client_id,
        DiseasePrediction.predicted_at >= one_week_ago
    ).group_by(DiseasePrediction.disease_name).all()
    
    # Get all predictions
    all_predictions = DiseasePrediction.query.filter_by(client_id=client_id).order_by(DiseasePrediction.predicted_at.desc()).limit(10).all()
    
    # Create chart
    chart_path = None
    if weekly_data:
        diseases = [d[0] for d in weekly_data]
        counts = [d[1] for d in weekly_data]
        
        plt.figure(figsize=(8, 5))
        colors_list = ['#4CAF50' if d == 'Healthy' else '#FF6B6B' for d in diseases]
        plt.bar(diseases, counts, color=colors_list, edgecolor='black', linewidth=1.2)
        plt.xlabel('Disease Type', fontsize=12, fontweight='bold')
        plt.ylabel('Number of Cases', fontsize=12, fontweight='bold')
        plt.title('Weekly Disease Distribution', fontsize=14, fontweight='bold')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        
        temp_dir = tempfile.gettempdir()
        chart_path = os.path.join(
        temp_dir, f"weekly_chart_{client_id}.png"
)

        plt.figure(figsize=(8, 5))
        colors_list = ['#4CAF50' if d == 'Healthy' else '#FF6B6B' for d in diseases]
        plt.bar(diseases, counts, color=colors_list, edgecolor='black', linewidth=1.2)
        plt.xlabel('Disease Type', fontsize=12, fontweight='bold')
        plt.ylabel('Number of Cases', fontsize=12, fontweight='bold')
        plt.title('Weekly Disease Distribution', fontsize=14, fontweight='bold')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()

        plt.savefig(chart_path, dpi=150)
        plt.close()
    
    # Create PDF
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    pdf = canvas.Canvas(temp_file.name, pagesize=letter)
    width, height = letter
    
    # Header with background
    pdf.setFillColor(colors.HexColor('#2E7D32'))
    pdf.rect(0, height - 100, width, 100, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 24)
    pdf.drawCentredString(width/2, height - 50, "Wheat Disease Detection Report")
    pdf.setFont("Helvetica", 12)
    pdf.drawCentredString(width/2, height - 75, f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}")
    
    y = height - 140
    
    # Client Information Box
    pdf.setFillColor(colors.HexColor('#E8F5E9'))
    pdf.rect(40, y - 80, width - 80, 80, fill=1, stroke=1)
    pdf.setFillColor(colors.black)
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(60, y - 25, "Client Information")
    pdf.setFont("Helvetica", 11)
    pdf.drawString(60, y - 45, f"Name: {client.name}")
    pdf.drawString(60, y - 62, f"Phone: {client.phone}")
    pdf.drawString(300, y - 45, f"Client ID: {client.id}")
    pdf.drawString(300, y - 62, f"Report Period: Last 7 days")
    
    y -= 120
    
    # Statistics Summary
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(40, y, "Statistics Summary")
    y -= 25
    
    stats_data = [
        ['Metric', 'Value'],
        ['Total Scans', str(stats.total_scans if stats else 0)],
        ['Diseases Detected', str(stats.diseases_detected if stats else 0)],
        ['Healthy Scans', str((stats.total_scans - stats.diseases_detected) if stats else 0)],
        ['Health Index', f"{round(((stats.total_scans - stats.diseases_detected) / stats.total_scans * 100) if stats and stats.total_scans > 0 else 100, 1)}%"]
    ]
    
    table = Table(stats_data, colWidths=[3*inch, 2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4CAF50')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F1F8E9')),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    table.wrapOn(pdf, width, height)
    table.drawOn(pdf, 40, y - 120)
    
    y -= 150
    
    # Chart
    if chart_path:
        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(40, y, "Weekly Disease Distribution")
        y -= 15
        pdf.drawImage(chart_path, 60, y - 280, width=480, height=260, preserveAspectRatio=True)
        y -= 300
    
    # New page for remedies
    pdf.showPage()
    y = height - 50
    
    # Remedies and Precautions
    pdf.setFillColor(colors.HexColor('#FF6B6B'))
    pdf.rect(0, y, width, 50, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawCentredString(width/2, y + 20, "Recommended Actions & Precautions")
    
    y -= 70
    pdf.setFillColor(colors.black)
    
    if weekly_data:
        for disease, count in weekly_data:
            if disease != "Healthy":
                pdf.setFont("Helvetica-Bold", 13)
                pdf.setFillColor(colors.HexColor('#C62828'))
                pdf.drawString(40, y, f"⚠ {disease} ({count} case{'s' if count > 1 else ''})")
                y -= 20
                
                pdf.setFillColor(colors.black)
                pdf.setFont("Helvetica-Bold", 11)
                pdf.drawString(60, y, "Recommended Remedies:")
                y -= 15
                
                remedies = REMEDY_MAP.get(disease, REMEDY_MAP["Other Disease"])
                pdf.setFont("Helvetica", 10)
                for i, remedy in enumerate(remedies, 1):
                    pdf.drawString(75, y, f"{i}. {remedy}")
                    y -= 15
                
                y -= 10
                
                if y < 100:
                    pdf.showPage()
                    y = height - 50
    
    # General Precautions
    if y < 200:
        pdf.showPage()
        y = height - 50
    
    pdf.setFont("Helvetica-Bold", 14)
    pdf.setFillColor(colors.HexColor('#1976D2'))
    pdf.drawString(40, y, "General Preventive Measures")
    y -= 25
    
    general_tips = [
        "Regular field monitoring and early disease detection",
        "Maintain optimal irrigation - avoid waterlogging",
        "Use disease-resistant wheat varieties when available",
          "Practice crop rotation to break disease cycles",
        "Remove and destroy infected plant debris promptly",
        "Ensure balanced fertilization - avoid excess nitrogen",
        "Maintain proper plant spacing for air circulation",
        "Use certified and treated seeds from reliable sources",
        "Keep farming equipment clean and sanitized",
        "Consult agricultural experts for severe infestations"
    ]
    
    pdf.setFillColor(colors.black)
    pdf.setFont("Helvetica", 10)
    for i, tip in enumerate(general_tips, 1):
        pdf.drawString(60, y, f"✓ {tip}")
        y -= 18
    
    # Footer
    pdf.setFont("Helvetica-Oblique", 9)
    pdf.setFillColor(colors.grey)
    pdf.drawCentredString(width/2, 30, "This report is generated by Wheat Disease Detection AI System")
    pdf.drawCentredString(width/2, 15, "For support, contact your agricultural advisor")
    
    pdf.save()
    
    # Cleanup chart
    if chart_path and os.path.exists(chart_path):
        os.remove(chart_path)
    
    return send_file(
        temp_file.name,
        as_attachment=True,
        download_name=f"wheat_disease_report_{client.name}_{datetime.now().strftime('%Y%m%d')}.pdf",
        mimetype="application/pdf"
    )

# Add these imports at the top if not already present
from datetime import datetime
import hashlib

# ... existing imports and setup ...

# Update the conversation history storage
conversation_history = {}

def get_conversation_key(disease, remote_addr, client_id=""):
    """Generate a unique conversation key"""
    base_str = f"{disease}_{remote_addr}_{client_id}"
    return hashlib.md5(base_str.encode()).hexdigest()[:16]

def analyze_question_intent(question):
    """Analyze the intent of the question"""
    question_lower = question.lower()
    
    intents = {
        "symptoms": any(word in question_lower for word in ['symptom', 'look like', 'identify', 'recognize']),
        "treatment": any(word in question_lower for word in ['treat', 'remedy', 'cure', 'spray', 'chemical']),
        "prevention": any(word in question_lower for word in ['prevent', 'avoid', 'stop']),
        "causes": any(word in question_lower for word in ['cause', 'why', 'reason']),
        "severity": any(word in question_lower for word in ['severe', 'serious', 'dangerous']),
        "timing": any(word in question_lower for word in ['when', 'time', 'season', 'month']),
        "cost": any(word in question_lower for word in ['cost', 'price', 'expensive']),
    }
    
    # Return the main intent
    for intent, is_present in intents.items():
        if is_present:
            return intent
    return "general"

@app.route('/api/wheat-bot', methods=['POST'])
def wheat_bot_endpoint():
    """
    Enhanced endpoint for wheat disease chatbot
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        question = data.get('question', '').strip()
        disease = data.get('disease', '').strip()
        client_id = data.get('client_id', '')
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        if not disease:
            return jsonify({'error': 'Disease name is required'}), 400
        
        # Generate conversation key
        conv_key = get_conversation_key(disease, request.remote_addr, client_id)
        
        # Get or initialize conversation history
        if conv_key not in conversation_history:
            conversation_history[conv_key] = {
                'disease': disease,
                'created_at': datetime.now().isoformat(),
                'messages': [],
                'question_types': []
            }
        
        history = conversation_history[conv_key]
        
        # Analyze question intent
        intent = analyze_question_intent(question)
        history['question_types'].append(intent)
        
        # Avoid repeating same type of questions in short time
        recent_intents = history['question_types'][-3:]  # Last 3 questions
        if recent_intents.count(intent) > 1:
            # If same intent repeated, add context to avoid repetition
            question = f"{question} (Please provide different aspects from previous answers)"
        
        # Add user message to history
        user_msg = {
            'role': 'user',
            'content': question,
            'intent': intent,
            'timestamp': datetime.now().isoformat()
        }
        history['messages'].append(user_msg)
        
        # Get response from chatbot
        reply = wheat_chatbot(question, disease)
        
        # Add assistant response to history
        assistant_msg = {
            'role': 'assistant',
            'content': reply,
            'timestamp': datetime.now().isoformat()
        }
        history['messages'].append(assistant_msg)
        
        # Keep only last 20 messages
        if len(history['messages']) > 20:
            history['messages'] = history['messages'][-20:]
        if len(history['question_types']) > 10:
            history['question_types'] = history['question_types'][-10:]
        
        conversation_history[conv_key] = history
        
        # Prepare response
        response_data = {
            'reply': reply,
            'disease': disease,
            'conversation_id': conv_key,
            'message_count': len(history['messages']),
            'current_intent': intent,
            'success': True,
            'suggestions': get_suggestions_based_on_intent(intent, disease)
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ Error in wheat-bot endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'error': 'Internal server error',
            'message': str(e),
            'success': False
        }), 500

def get_suggestions_based_on_intent(intent, disease):
    """Get follow-up question suggestions based on intent"""
    suggestions = {
        "symptoms": [
            f"How quickly do symptoms of {disease} appear?",
            f"What parts of the plant show symptoms first in {disease}?",
            f"Can {disease} be confused with other diseases?"
        ],
        "treatment": [
            f"What's the most cost-effective treatment for {disease}?",
            f"Are there organic options for treating {disease}?",
            f"How often should I apply treatment for {disease}?"
        ],
        "prevention": [
            f"What are the best resistant varieties against {disease}?",
            f"How can I prevent {disease} in the next season?",
            f"What cultural practices help prevent {disease}?"
        ],
        "general": [
            f"What causes {disease} to spread?",
            f"How severe is {disease} compared to other wheat diseases?",
            f"What's the economic impact of {disease}?"
        ]
    }
    
    return suggestions.get(intent, [
        f"What are the main symptoms of {disease}?",
        f"How to treat {disease} effectively?",
        f"How to prevent {disease} next season?"
    ])

@app.route('/api/chat-history/<conversation_id>', methods=['GET'])
def get_chat_history(conversation_id):
    """Get detailed conversation history"""
    history = conversation_history.get(conversation_id)
    if not history:
        return jsonify({'error': 'Conversation not found'}), 404
    
    return jsonify({
        'history': history['messages'],
        'disease': history['disease'],
        'created_at': history['created_at'],
        'question_types': history['question_types']
    })

@app.route('/api/suggest-questions/<disease>', methods=['GET'])
def suggest_questions(disease):
    """Get suggested questions for a disease"""
    questions = {
        "symptoms": [
            f"What are the first signs of {disease}?",
            f"How to identify {disease} in early stages?",
            f"What do {disease} symptoms look like on leaves?"
        ],
        "treatment": [
            f"What's the best chemical for {disease}?",
            f"Are there home remedies for {disease}?",
            f"When is the best time to treat {disease}?"
        ],
        "prevention": [
            f"How to prevent {disease} naturally?",
            f"What farming practices reduce {disease} risk?",
            f"Are there {disease}-resistant wheat varieties?"
        ],
        "impact": [
            f"How much yield loss does {disease} cause?",
            f"Can {disease} affect grain quality?",
            f"Is {disease} contagious to other crops?"
        ]
    }
    
    return jsonify(questions)

@app.route("/predict-fertilizer", methods=["POST"])
def predict_fertilizer():
    """
    Predict fertilizer based on soil and crop parameters
    Expected JSON format:
    {
        "temperature": 25.5,
        "humidity": 65.0,
        "moisture": 45.0,
        "soilType": "Black",
        "cropType": "Wheat",
        "nitrogen": 40.0,
        "potassium": 30.0,
        "phosphorous": 50.0
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Validate required fields
        required_fields = ['temperature', 'humidity', 'moisture', 'soilType', 
                          'cropType', 'nitrogen', 'potassium', 'phosphorous']
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({"error": f"Missing fields: {', '.join(missing_fields)}"}), 400
        
        # Check if model is loaded
        if fertilizer_model is None:
            return jsonify({"error": "Fertilizer model not loaded"}), 500
        
        # Validate numeric inputs
        try:
            temperature = float(data['temperature'])
            humidity = float(data['humidity'])
            moisture = float(data['moisture'])
            nitrogen = float(data['nitrogen'])
            potassium = float(data['potassium'])
            phosphorous = float(data['phosphorous'])
        except ValueError:
            return jsonify({"error": "Numeric fields must be valid numbers"}), 400
        
        # Validate ranges
        if not (0 <= humidity <= 100):
            return jsonify({"error": "Humidity must be between 0 and 100"}), 400
        
        if not (0 <= moisture <= 100):
            return jsonify({"error": "Moisture must be between 0 and 100"}), 400
        
        soil_type = data['soilType']
        crop_type = data['cropType']
        
        # Prepare input data for model (match training data column order)
        # Assuming columns: Temperature, Humidity, Moisture, Nitrogen, Phosphorous, Potassium, Soil_Type, Crop_Type
        input_data = pd.DataFrame({
            'Temperature': [temperature],
            'Humidity': [humidity],
            'Moisture': [moisture],
            'Nitrogen': [nitrogen],
            'Phosphorous': [phosphorous],
            'Potassium': [potassium],
            'Soil_Type': [soil_type],
            'Crop_Type': [crop_type]
        })
        
        # Make prediction
        prediction = fertilizer_model.predict(input_data)
        predicted_fertilizer = prediction[0]
        
        # Get prediction probabilities if available
        try:
            probabilities = fertilizer_model.predict_proba(input_data)
            confidence = float(max(probabilities[0])) * 100
        except:
            confidence = 95.0  # Default confidence if probabilities not available
        
        # Fertilizer information
        fertilizer_info = {
            'Urea': {
                'npk': '46-0-0',
                'description': 'High nitrogen content, excellent for vegetative growth',
                'usage': 'Apply during early growth stages'
            },
            'DAP': {
                'npk': '18-46-0',
                'description': 'High phosphorus, promotes root development',
                'usage': 'Apply at sowing time'
            },
            'TSP': {
                'npk': '0-46-0',
                'description': 'Triple superphosphate, concentrated phosphorus',
                'usage': 'Apply during soil preparation'
            },
            '10-26-26': {
                'npk': '10-26-26',
                'description': 'Balanced NPK with higher P and K',
                'usage': 'Suitable for flowering and fruiting stages'
            },
            '14-35-14': {
                'npk': '14-35-14',
                'description': 'Phosphorus-rich balanced fertilizer',
                'usage': 'Apply during flowering stage'
            },
            '17-17-17': {
                'npk': '17-17-17',
                'description': 'Balanced NPK for all-round nutrition',
                'usage': 'Apply throughout growth cycle'
            },
            '20-20': {
                'npk': '20-20-0',
                'description': 'Balanced N-P fertilizer',
                'usage': 'Apply during early to mid growth'
            },
            '28-28': {
                'npk': '28-28-0',
                'description': 'High nitrogen and phosphorus',
                'usage': 'Apply for rapid growth'
            },
            'Potassium chloride': {
                'npk': '0-0-60',
                'description': 'High potassium, enhances disease resistance',
                'usage': 'Apply during fruiting stage'
            },
            'Potassium sulfate.': {
                'npk': '0-0-50',
                'description': 'Sulfate form of potassium, chloride-free',
                'usage': 'Suitable for chloride-sensitive crops'
            }
        }
        
        fertilizer_details = fertilizer_info.get(predicted_fertilizer, {
            'npk': 'Contact agronomist',
            'description': 'Specialized fertilizer',
            'usage': 'Follow expert recommendations'
        })
        
        return jsonify({
            "success": True,
            "fertilizer": predicted_fertilizer,
            "confidence": round(confidence, 2),
            "npk_ratio": fertilizer_details['npk'],
            "description": fertilizer_details['description'],
            "usage_instructions": fertilizer_details['usage'],
            "input_parameters": {
                "temperature": temperature,
                "humidity": humidity,
                "moisture": moisture,
                "nitrogen": nitrogen,
                "phosphorous": phosphorous,
                "potassium": potassium,
                "soil_type": soil_type,
                "crop_type": crop_type
            }
        })
        
    except Exception as e:
        print(f"❌ Error in fertilizer prediction: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500



# -------------------- RUN SERVER --------------------
if __name__ == "__main__":
    # Run the Flask backend on port 5001 so it does not conflict with the Node backend on port 5000
    app.run(debug=True, port=5001)