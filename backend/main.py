from flask import Flask, request, jsonify
from Crypto.PublicKey import RSA
from Crypto.Cipher import AES, PKCS1_OAEP
from Crypto.Random import get_random_bytes
from base64 import b64encode, b64decode
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# AES Encryption Function
def encrypt_aes(content, key):
    cipher = AES.new(key, AES.MODE_EAX)
    ciphertext, tag = cipher.encrypt_and_digest(content.encode('utf-8'))
    return {
        'ciphertext': b64encode(ciphertext).decode('utf-8'),
        'nonce': b64encode(cipher.nonce).decode('utf-8'),
        'tag': b64encode(tag).decode('utf-8'),
    }

# RSA Encryption Function
def encrypt_rsa(content, public_key):
    key = RSA.import_key(public_key)
    cipher = PKCS1_OAEP.new(key)
    ciphertext = cipher.encrypt(content.encode('utf-8'))
    return b64encode(ciphertext).decode('utf-8')

# AES Decryption Function
def decrypt_aes(ciphertext, nonce, tag, key):
    cipher = AES.new(key, AES.MODE_EAX, nonce=b64decode(nonce))
    plaintext = cipher.decrypt_and_verify(b64decode(ciphertext), b64decode(tag))
    return plaintext.decode('utf-8')

# RSA Decryption Function
def decrypt_rsa(ciphertext, private_key):
    key = RSA.import_key(private_key)
    cipher = PKCS1_OAEP.new(key)
    plaintext = cipher.decrypt(b64decode(ciphertext))
    return plaintext.decode('utf-8')

# Encrypt endpoint
@app.route('/encrypt', methods=['POST'])
def encrypt():
    data = request.get_json()
    content = data.get('content')  # Payload to encrypt
    selected_technique = data.get('selected_technique')

    # AES Encryption
    if selected_technique == 'AES':
        key = get_random_bytes(16)  # Generate random AES key (in bytes)
        encrypted_data = encrypt_aes(content, key)

        return jsonify({
            "encrypted_content": encrypted_data['ciphertext'],
            "nonce": encrypted_data['nonce'],
            "tag": encrypted_data['tag'],
            "key": b64encode(key).decode('utf-8'),  # Return the AES key
        }), 200

    # RSA Encryption
    elif selected_technique == 'RSA':
        key_pair = RSA.generate(2048)
        private_key = key_pair.export_key().decode('utf-8')
        public_key = key_pair.publickey().export_key().decode('utf-8')
        encrypted_content = encrypt_rsa(content, public_key)

        return jsonify({
            "encrypted_content": encrypted_content,
            "public_key": public_key,
            "private_key": private_key,
        }), 200

    return jsonify({"error": "Unsupported encryption technique"}), 400

# Decrypt endpoint
@app.route('/decrypt', methods=['POST'])
def decrypt():
    data = request.get_json()
    encrypted_content = data.get('encrypted_content')
    selected_technique = data.get('selected_technique')

    # Validate that the necessary fields exist
    if not encrypted_content or not selected_technique:
        return jsonify({"error": "Missing encrypted content or decryption technique"}), 400

    # Decryption for AES
    if selected_technique == 'AES':
        nonce = data.get('nonce')
        tag = data.get('tag')
        key = data.get('encryption_key')
        
        if not nonce or not tag or not key:
            return jsonify({"error": "Missing nonce, tag, or key for AES decryption"}), 400
        
        try:
            key = b64decode(key)  # Decode AES key from base64
            decrypted_content = decrypt_aes(encrypted_content, nonce, tag, key)
            return jsonify({"decrypted_content": decrypted_content}), 200
        except Exception as e:
            return jsonify({"error": "Decryption failed", "message": str(e)}), 400

    # Decryption for RSA
    elif selected_technique == 'RSA':
        private_key = data.get('private_key')
        
        if not private_key:
            return jsonify({"error": "Missing private key for RSA decryption"}), 400
        
        try:
            private_key = b64decode(private_key)  # Decode private key from base64
            decrypted_content = decrypt_rsa(encrypted_content, private_key)
            return jsonify({"decrypted_content": decrypted_content}), 200
        except Exception as e:
            return jsonify({"error": "Decryption failed", "message": str(e)}), 400

    return jsonify({"error": "Unsupported decryption technique"}), 400

if __name__ == '__main__':
    app.run(debug=True)
