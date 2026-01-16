# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import random
import pandas as pd

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from frontend

# Movie database with genres and features
MOVIE_DATABASE = {
    "Spider Man": {
        "genres": ["Action", "Adventure", "Superhero"],
        "year": 2017,
        "director": "Jon Watts",
        "rating": 4.2,
        "keywords": ["superhero", "action", "adventure", "marvel", "spider", "young adult"]
    },
    "Money Heist": {
        "genres": ["Crime", "Drama", "Thriller"],
        "year": 2017,
        "director": "Álex Pina",
        "rating": 4.5,
        "keywords": ["heist", "crime", "thriller", "spanish", "drama", "strategy"]
    },
    "Peaky Blinders": {
        "genres": ["Crime", "Drama", "Period"],
        "year": 2013,
        "director": "Steven Knight",
        "rating": 4.4,
        "keywords": ["crime", "period", "drama", "british", "gang", "historical"]
    },
    "Dark": {
        "genres": ["Sci-Fi", "Mystery", "Drama"],
        "year": 2017,
        "director": "Baran bo Odar",
        "rating": 4.6,
        "keywords": ["time travel", "mystery", "sci-fi", "german", "complex", "dark"]
    },
    "The Notebook": {
        "genres": ["Romance", "Drama"],
        "year": 2004,
        "director": "Nick Cassavetes",
        "rating": 4.1,
        "keywords": ["romance", "drama", "love story", "emotional", "classic", "tearjerker"]
    },
    "The Day of the Jackal": {
        "genres": ["Thriller", "Action", "Crime"],
        "year": 2024,
        "director": "Brian Kirk",
        "rating": 4.0,
        "keywords": ["thriller", "assassin", "action", "crime", "suspense", "cat and mouse"]
    },
    "Tees Maar Khan": {
        "genres": ["Comedy", "Action", "Bollywood"],
        "year": 2010,
        "director": "Farah Khan",
        "rating": 3.2,
        "keywords": ["comedy", "bollywood", "action", "heist", "funny", "indian"]
    },
    "Transformers": {
        "genres": ["Action", "Sci-Fi", "Adventure"],
        "year": 2007,
        "director": "Michael Bay",
        "rating": 3.8,
        "keywords": ["robots", "action", "sci-fi", "adventure", "explosions", "michael bay"]
    },
    "Red Zone": {
        "genres": ["Action", "Thriller", "War"],
        "year": 2023,
        "director": "Unknown",
        "rating": 3.9,
        "keywords": ["war", "action", "thriller", "military", "combat", "intense"]
    },
    "Suits": {
        "genres": ["Drama", "Legal", "Comedy"],
        "year": 2011,
        "director": "Aaron Korsh",
        "rating": 4.3,
        "keywords": ["legal", "drama", "lawyers", "corporate", "wit", "friendship"]
    },
    "Miracle in Cell No 7": {
        "genres": ["Drama", "Family", "Emotional"],
        "year": 2019,
        "director": "Mehmet Ada Öztekin",
        "rating": 4.7,
        "keywords": ["emotional", "family", "drama", "turkish", "heartwarming", "father daughter"]
    },
    "Maleficent": {
        "genres": ["Fantasy", "Adventure", "Family"],
        "year": 2014,
        "director": "Robert Stromberg",
        "rating": 3.9,
        "keywords": ["fantasy", "disney", "fairy tale", "magic", "adventure", "angelina jolie"]
    },
    "Badla": {
        "genres": ["Mystery", "Thriller", "Crime"],
        "year": 2019,
        "director": "Sujoy Ghosh",
        "rating": 4.2,
        "keywords": ["mystery", "thriller", "bollywood", "crime", "plot twist", "suspense"]
    },
    "Stranger Things": {
        "genres": ["Sci-Fi", "Horror", "Adventure"],
        "year": 2016,
        "director": "Duffer Brothers",
        "rating": 4.5,
        "keywords": ["supernatural", "80s", "kids", "horror", "sci-fi", "upside down"]
    },
    "The Crown": {
        "genres": ["Drama", "Historical", "Biography"],
        "year": 2016,
        "director": "Peter Morgan",
        "rating": 4.4,
        "keywords": ["royal", "british", "historical", "drama", "biography", "politics"]
    },
    "Orange is the New Black": {
        "genres": ["Drama", "Comedy", "Crime"],
        "year": 2013,
        "director": "Jenji Kohan",
        "rating": 4.2,
        "keywords": ["prison", "women", "drama", "comedy", "social issues", "diverse"]
    },
    "Inception": {
        "genres": ["Sci-Fi", "Thriller", "Action"],
        "year": 2010,
        "director": "Christopher Nolan",
        "rating": 4.8,
        "keywords": ["dreams", "sci-fi", "complex", "nolan", "mind bending", "action"]
    },
    "Intersteller": {
        "genres": ["Sci-Fi", "Drama", "Adventure"],
        "year": 2014,
        "director": "Christopher Nolan",
        "rating": 4.7,
        "keywords": ["space", "sci-fi", "nolan", "emotional", "time", "father daughter"]
    }
}

# Data storage files
USER_DATA_FILE = 'user_data.json'
SEARCH_DATA_FILE = 'search_data.json'
WATCH_DATA_FILE = 'watch_data.json'

def load_json_file(filename):
    """Load JSON data from file or return empty dict if file doesn't exist"""
    try:
        if os.path.exists(filename):
            with open(filename, 'r') as f:
                return json.load(f)
        return {}
    except:
        return {}

def save_json_file(filename, data):
    """Save data to JSON file"""
    try:
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except:
        return False


# Simple deterministic recommendations: sort by watch count, likes, dislikes, recency
def get_simple_recommendations(user_data, search_data, watch_data, n=12):
    """
    Strictly deterministic recommendations:
    - Always sort by: watch_count desc, liked, search_points, rating, title.
    - Disliked movies are always removed.
    - No randomness, no time-based changes, no special case for fresh user.
    - Order only changes when user acts.
    """
    titles = list(MOVIE_DATABASE.keys())
    preferences = user_data.get('preferences', {})

    stats = []
    for t in titles:
        watch = watch_data.get(t, {})
        last_watch = watch.get('last_watch')
        prefs = preferences.get(t, {})
        liked = prefs.get('liked', False)
        disliked = prefs.get('disliked', False)
        stats.append({
            'title': t,
            'last_watch': last_watch,
            'liked': liked,
            'disliked': disliked,
            'rating': MOVIE_DATABASE[t]['rating'],
        })

    # Remove disliked movies
    stats = [s for s in stats if not s['disliked']]

    # Find the two most recently watched movies
    watched_with_time = [(s['last_watch'], s) for s in stats if s['last_watch']]
    watched_with_time = [ (datetime.fromisoformat(lw), s) for lw, s in watched_with_time if lw ]
    watched_with_time.sort(reverse=True)
    recent_two = [s for _, s in watched_with_time[:2]]
    recent_two_titles = set(s['title'] for s in recent_two)

    # Find liked movies not in recent_two
    liked_movies = [s for s in stats if s['liked'] and s['title'] not in recent_two_titles]

    # The rest
    rest = [s for s in stats if s['title'] not in recent_two_titles and not s['liked']]
    rest.sort(key=lambda x: (x['title'].lower()))

    # Build ordered list
    ordered = recent_two + liked_movies + rest

    # Return top n
    return [
        {
            'title': s['title'],
            'reasons': [
                "Recently Watched" if s in recent_two else None,
                "Liked" if s in liked_movies else None,
            ]
        }
        for s in ordered[:n]
    ]

@app.route('/api/track-preference', methods=['POST'])
def track_preference():
    """Track user like/dislike preferences"""
    try:
        data = request.json
        movie = data.get('movie')
        liked = data.get('liked')
        disliked = data.get('disliked')
        
        user_data = load_json_file(USER_DATA_FILE)
        
        if 'preferences' not in user_data:
            user_data['preferences'] = {}
        
        user_data['preferences'][movie] = {
            'liked': liked,
            'disliked': disliked,
            'timestamp': datetime.now().isoformat()
        }
        
        save_json_file(USER_DATA_FILE, user_data)
        
        return jsonify({'status': 'success', 'message': 'Preference tracked'})
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/track-search', methods=['POST'])
def track_search():
    """Track user search queries"""
    try:
        data = request.json
        query = data.get('query', '').lower()
        
        if not query:
            return jsonify({'status': 'error', 'message': 'No query provided'}), 400
        
        search_data = load_json_file(SEARCH_DATA_FILE)
        
        if query not in search_data:
            search_data[query] = {'count': 0, 'first_search': datetime.now().isoformat()}
        
        search_data[query]['count'] += 1
        search_data[query]['last_search'] = datetime.now().isoformat()
        
        save_json_file(SEARCH_DATA_FILE, search_data)
        
        return jsonify({'status': 'success', 'message': 'Search tracked'})
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/track-watch', methods=['POST'])
def track_watch():
    """Track user watch history"""
    try:
        data = request.json
        movie = data.get('movie')
        
        watch_data = load_json_file(WATCH_DATA_FILE)
        
        if movie not in watch_data:
            watch_data[movie] = {'count': 0, 'first_watch': datetime.now().isoformat()}
        
        watch_data[movie]['count'] += 1
        watch_data[movie]['last_watch'] = datetime.now().isoformat()
        
        save_json_file(WATCH_DATA_FILE, watch_data)
        
        return jsonify({'status': 'success', 'message': 'Watch tracked'})
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/track-watch-progress', methods=['POST'])
def track_watch_progress():
    """Incrementally track watch progress in seconds for a given title"""
    try:
        data = request.json
        title = data.get('title') or data.get('movie')
        seconds = data.get('seconds')
        if not title or seconds is None:
            return jsonify({'status': 'error', 'message': 'Missing title or seconds'}), 400
        try:
            seconds = float(seconds)
        except Exception:
            return jsonify({'status': 'error', 'message': 'Invalid seconds'}), 400
        if seconds < 0:
            seconds = 0.0

        watch_data = load_json_file(WATCH_DATA_FILE)
        entry = watch_data.get(title, {'count': 0, 'first_watch': datetime.now().isoformat()})
        entry['seconds'] = float(entry.get('seconds', 0.0)) + seconds
        entry['last_watch'] = datetime.now().isoformat()
        watch_data[title] = entry
        save_json_file(WATCH_DATA_FILE, watch_data)
        return jsonify({'status': 'success', 'title': title, 'seconds_total': entry['seconds']})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/get-recommendations', methods=['GET'])
def get_recommendations():
    """Get simple deterministic recommendations"""
    try:
        user_data = load_json_file(USER_DATA_FILE)
        search_data = load_json_file(SEARCH_DATA_FILE)
        watch_data = load_json_file(WATCH_DATA_FILE)
        items = get_simple_recommendations(user_data, search_data, watch_data, n=100)  # get all, will slice to 12 later

        # Find the two most recently watched movies (by last_watch timestamp)
        watched_times = []
        for title, entry in watch_data.items():
            lw = entry.get('last_watch')
            if lw:
                try:
                    dt = datetime.fromisoformat(lw)
                    watched_times.append((dt, title))
                except Exception:
                    continue
        watched_times.sort(reverse=True)
        recent_watched_titles = [t for _, t in watched_times[:2]]

        # Find liked movies (excluding already in recent_watched_titles)
        preferences = user_data.get('preferences', {})
        liked_titles = [t for t, p in preferences.items() if p.get('liked') and t not in recent_watched_titles]

        # Build new recommendations list: recent watched (in order), then liked, then rest
        rec_titles = [it['title'] for it in items]
        ordered = []
        # Add recent watched
        for t in recent_watched_titles:
            if t in rec_titles:
                idx = rec_titles.index(t)
                ordered.append(items[idx])
                rec_titles.pop(idx)
                items.pop(idx)
        # Add liked
        for t in liked_titles:
            if t in rec_titles:
                idx = rec_titles.index(t)
                ordered.append(items[idx])
                rec_titles.pop(idx)
                items.pop(idx)
        # Add the rest
        ordered.extend(items)

        # Only return top 12
        ordered = ordered[:12]

        return jsonify({
            'status': 'success',
            'recommendations': [it['title'] for it in ordered],
            'itemsDetailed': ordered,
            'algorithm': 'recent2_then_liked_then_rest'
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/get-movie-info/<movie_title>', methods=['GET'])
def get_movie_info(movie_title):
    """Get detailed movie information"""
    try:
        if movie_title in MOVIE_DATABASE:
            return jsonify({
                'status': 'success',
                'movie': MOVIE_DATABASE[movie_title]
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Movie not found'
            }), 404
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/get-user-stats', methods=['GET'])
def get_user_stats():
    """Get user statistics for debugging"""
    try:
        user_data = load_json_file(USER_DATA_FILE)
        search_data = load_json_file(SEARCH_DATA_FILE)
        watch_data = load_json_file(WATCH_DATA_FILE)
        
        # Calculate stats
        liked_count = sum(1 for prefs in user_data.get('preferences', {}).values() if prefs.get('liked'))
        disliked_count = sum(1 for prefs in user_data.get('preferences', {}).values() if prefs.get('disliked'))
        total_searches = sum(data.get('count', 0) for data in search_data.values())
        total_watches = sum(data.get('count', 0) for data in watch_data.values())
        
        return jsonify({
            'status': 'success',
            'stats': {
                'liked_movies': liked_count,
                'disliked_movies': disliked_count,
                'total_searches': total_searches,
                'total_watches': total_watches,
                'unique_searches': len(search_data),
                'unique_watches': len(watch_data)
            }
        })
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)