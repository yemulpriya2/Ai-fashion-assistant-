import json
import base64
import urllib.request
import urllib.error
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.conf import settings
from .models import StyleSession, UserProfile


# ─── INDEX ───
def index(request):
    return render(request, 'index.html')


# ─── ANALYZE ───
@csrf_exempt
@require_http_methods(["POST"])
def analyze(request):
    """
    Receives photo + preferences, calls Claude API, stores result, returns JSON.
    """
    try:
        data = json.loads(request.body)
        photo_b64 = data.get('photo')       # base64 image data (without prefix)
        media_type = data.get('media_type', 'image/jpeg')
        occasion = data.get('occasion', 'Casual / Everyday')
        gender = data.get('gender', 'Female')
        style_pref = data.get('style_preference', 'Classic & Timeless')

        if not photo_b64:
            return JsonResponse({'error': 'No photo provided'}, status=400)

        # Build prompt
        prompt = build_prompt(occasion, gender, style_pref)

        # Call Claude API
        result = call_claude_api(photo_b64, media_type, prompt)

        # Save session to DB
        session = StyleSession.objects.create(
            user=request.user if request.user.is_authenticated else None,
            occasion=occasion,
            gender=gender,
            style_preference=style_pref,
            skin_tone_type=result.get('skinTone', {}).get('type', ''),
            skin_tone_undertone=result.get('skinTone', {}).get('undertone', ''),
            result_json=result,
        )

        return JsonResponse({'success': True, 'data': result, 'session_id': session.id})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def build_prompt(occasion, gender, style_pref):
    return f"""You are Fashiora, an expert AI fashion stylist. Analyze this photo carefully.

Occasion: {occasion}
Gender: {gender}
Style Preference: {style_pref}

Based on the person's appearance, provide a complete fashion analysis.
Respond ONLY with valid JSON (no markdown, no preamble):

{{
  "skinTone": {{
    "type": "e.g. Warm Medium",
    "undertone": "Warm / Cool / Neutral / Olive",
    "description": "2 sentences about their skin tone"
  }},
  "outfits": [
    {{
      "occasion": "{occasion}",
      "name": "creative outfit name",
      "description": "2 sentence description of why it works",
      "items": ["item 1", "item 2", "item 3", "footwear", "accessory"]
    }},
    {{
      "occasion": "Evening / Night Out",
      "name": "creative outfit name",
      "description": "2 sentence description",
      "items": ["item 1", "item 2", "item 3", "footwear", "accessory"]
    }},
    {{
      "occasion": "Casual Chic",
      "name": "creative outfit name",
      "description": "2 sentence description",
      "items": ["item 1", "item 2", "item 3", "footwear", "accessory"]
    }}
  ],
  "colorPalette": [
    {{"name": "color name", "hex": "#hexcode"}},
    {{"name": "color name", "hex": "#hexcode"}},
    {{"name": "color name", "hex": "#hexcode"}},
    {{"name": "color name", "hex": "#hexcode"}},
    {{"name": "color name", "hex": "#hexcode"}},
    {{"name": "color name", "hex": "#hexcode"}}
  ],
  "colorsToAvoid": [
    {{"name": "color name", "hex": "#hexcode"}},
    {{"name": "color name", "hex": "#hexcode"}}
  ],
  "styleTips": [
    "Tip about necklines/silhouettes",
    "Tip about patterns/prints",
    "Tip about fabrics/textures",
    "Tip about accessories/jewelry"
  ]
}}"""


def call_claude_api(photo_b64, media_type, prompt):
    """Call Anthropic Claude API with vision."""
    api_key = settings.ANTHROPIC_API_KEY

    payload = {
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 1000,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": photo_b64
                        }
                    },
                    {"type": "text", "text": prompt}
                ]
            }
        ]
    }

    req = urllib.request.Request(
        'https://api.anthropic.com/v1/messages',
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'x-api-key': api_key,
            'anthropic-version': '2023-06-01'
        },
        method='POST'
    )

    with urllib.request.urlopen(req, timeout=60) as resp:
        response_data = json.loads(resp.read().decode('utf-8'))

    text = ''.join(c.get('text', '') for c in response_data.get('content', []))

    # Clean and parse JSON
    clean = text.replace('```json', '').replace('```', '').strip()
    import re
    match = re.search(r'\{[\s\S]*\}', clean)
    if match:
        return json.loads(match.group(0))
    return json.loads(clean)


# ─── AUTH ───
@csrf_exempt
@require_http_methods(["POST"])
def register_user(request):
    try:
        data = json.loads(request.body)
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not name or not email or not password:
            return JsonResponse({'error': 'All fields are required.'}, status=400)

        if len(password) < 6:
            return JsonResponse({'error': 'Password must be at least 6 characters.'}, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'This email is already registered. Please sign in.'}, status=400)

        # Use email as username (unique)
        username = email
        first_name = name.split()[0] if name else ''
        last_name = ' '.join(name.split()[1:]) if len(name.split()) > 1 else ''

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        UserProfile.objects.create(user=user)
        login(request, user)

        return JsonResponse({
            'success': True,
            'user': {'name': name, 'email': email}
        })

    except Exception as e:
        return JsonResponse({'error': f'Registration failed: {str(e)}'}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def login_user(request):
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return JsonResponse({'error': 'Please enter email and password.'}, status=400)

        # Authenticate using email as username
        user = authenticate(request, username=email, password=password)
        if user:
            login(request, user)
            full_name = user.get_full_name() or user.email
            return JsonResponse({
                'success': True,
                'user': {'name': full_name, 'email': user.email}
            })

        return JsonResponse({'error': 'Incorrect email or password. Please try again.'}, status=401)

    except Exception as e:
        return JsonResponse({'error': f'Login failed: {str(e)}'}, status=500)


@csrf_exempt
@require_http_methods(["POST", "GET"])
def logout_user(request):
    logout(request)
    return JsonResponse({'success': True})


# ─── HISTORY ───
@require_http_methods(["GET"])
def get_history(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Login required'}, status=401)

    sessions = StyleSession.objects.filter(user=request.user)[:20]
    history = [{
        'id': s.id,
        'occasion': s.occasion,
        'skin_tone': s.skin_tone_type,
        'created_at': s.created_at.strftime('%d %b %Y, %I:%M %p'),
    } for s in sessions]

    return JsonResponse({'history': history})