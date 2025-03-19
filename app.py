from flask import Flask, render_template, request, jsonify
import spacy

app = Flask(__name__)
nlp = spacy.load("en_core_web_sm")

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/voice-command', methods=['POST'])
def voice_command():
    data = request.json
    voice_text = data.get("text", "").lower()  # Ensure the text is in lowercase
    action = "Command not recognized"

    # Basic Command Mapping
    if "zoom in" in voice_text:
        action = "zoomIn"
    elif "zoom out" in voice_text:
        action = "zoomOut"
    elif "find restaurant" in voice_text:
        action = "findRestaurants"
    
    return jsonify({"action": action})

if __name__ == "__main__":
    app.run(debug=True)