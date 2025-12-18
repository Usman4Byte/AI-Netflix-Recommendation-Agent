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

class MovieRecommendationAI:
    def __init__(self):
        self.movies_df = self.create_movies_dataframe()
        self.text_vectorizer = TfidfVectorizer(min_df=1, lowercase=True)
        self.scaler = StandardScaler()
        self._fit_feature_space()
    
    def create_movies_dataframe(self):
        """Convert movie database to pandas DataFrame"""
        movies_data = []
        for title, info in MOVIE_DATABASE.items():
            movies_data.append({
                'title': title,
                'genres': info['genres'],
                'year': info['year'],
                'rating': info['rating'],
                'keywords': info['keywords'],
                'director': info['director'],
                'text': ' '.join(info['genres'] + info['keywords'] + [info['director']])
            })
        return pd.DataFrame(movies_data)
    
    def _fit_feature_space(self):
        """Build item feature space: TF-IDF (text) + scaled numeric features"""
        # TF-IDF text features over genres + keywords + director
        self.tfidf_matrix = self.text_vectorizer.fit_transform(self.movies_df['text'])
        # Numerical features
        numerical = self.movies_df[['year', 'rating']].values
        self.numeric_scaled = self.scaler.fit_transform(numerical)
        # Dense item vectors
        self.item_vectors = np.hstack([self.tfidf_matrix.toarray(), self.numeric_scaled])
        # Index lookup
        self.title_to_index = {t: i for i, t in enumerate(self.movies_df['title'])}
    
    def get_user_preferences_vector(self, user_data):
        """Extract liked/disliked lists from user data"""
        liked_movies = []
        disliked_movies = []
        for movie, prefs in user_data.get('preferences', {}).items():
            if prefs.get('liked', False):
                liked_movies.append(movie)
            elif prefs.get('disliked', False):
                disliked_movies.append(movie)
        return liked_movies, disliked_movies
    
    def calculate_content_similarity(self, target_movie_idx):
        """Calculate content-based similarity scores to a target movie"""
        # Similarity over dense item vectors (text + numeric)
        target_vec = self.item_vectors[target_movie_idx].reshape(1, -1)
        sims = cosine_similarity(target_vec, self.item_vectors).flatten()
        return sims
    
    def get_genre_preferences(self, liked_movies, disliked_movies):
        """Analyze user's genre preferences"""
        genre_scores = {}
        
        # Positive scores for liked movies
        for movie in liked_movies:
            if movie in MOVIE_DATABASE:
                for genre in MOVIE_DATABASE[movie]['genres']:
                    genre_scores[genre] = genre_scores.get(genre, 0) + 1
        
        # Negative scores for disliked movies
        for movie in disliked_movies:
            if movie in MOVIE_DATABASE:
                for genre in MOVIE_DATABASE[movie]['genres']:
                    genre_scores[genre] = genre_scores.get(genre, 0) - 0.5
        
        return genre_scores
    
    def calculate_watch_time_boost(self, watch_data):
        """Calculate boost based on watch time and frequency"""
        watch_scores = {}
        
        for movie, data in watch_data.items():
            count = data.get('count', 0)
            # Movies watched multiple times get higher scores
            if count > 1:
                watch_scores[movie] = min(count * 0.3, 1.0)  # Cap at 1.0
            elif count == 1:
                watch_scores[movie] = 0.2
        
        return watch_scores
    
    def _build_user_profile(self, user_data, watch_data, search_data):
        """Construct a user profile vector from likes, dislikes, watches, searches"""
        liked, disliked = self.get_user_preferences_vector(user_data)
        profile = np.zeros(self.item_vectors.shape[1], dtype=float)
        # Weights
        like_w = 1.0
        dislike_w = -0.7
        watch_w_per_view = 0.2
        search_w_per_query = 0.2  # increase sensitivity to searches
        # Likes / dislikes
        for m in liked:
            if m in self.title_to_index:
                profile += like_w * self.item_vectors[self.title_to_index[m]]
        for m in disliked:
            if m in self.title_to_index:
                profile += dislike_w * self.item_vectors[self.title_to_index[m]]
        # Watches
        for m, data in watch_data.items():
            if m in self.title_to_index:
                count = max(0, int(data.get('count', 0)))
                boost = min(count * watch_w_per_view, 0.8)
                profile += boost * self.item_vectors[self.title_to_index[m]]
        # Searches mapped into TF-IDF space
        for q, data in search_data.items():
            try:
                q_vec = self.text_vectorizer.transform([q]).toarray()
                q_weight = min(data.get('count', 0) * search_w_per_query, 0.8)
                profile[:q_vec.shape[1]] += q_weight * q_vec[0]
            except Exception:
                pass
        # Normalize
        norm = np.linalg.norm(profile)
        if norm > 0:
            profile = profile / norm
        return profile, liked, disliked

    def _explain_for_item(self, title, liked):
        info = MOVIE_DATABASE.get(title, {})
        reasons = []
        # Genre overlap with liked movies
        liked_genres = {}
        for m in liked:
            for g in MOVIE_DATABASE.get(m, {}).get('genres', []):
                liked_genres[g] = liked_genres.get(g, 0) + 1
        overlaps = [g for g in info.get('genres', []) if g in liked_genres]
        if overlaps:
            reasons.append(f"Matches your liked genres: {', '.join(sorted(set(overlaps)))}")
        # Similar to a top liked movie
        try:
            idx_target = self.title_to_index[title]
            best_sim = 0.0
            best_like = None
            for m in liked:
                if m in self.title_to_index:
                    idx_like = self.title_to_index[m]
                    sim = cosine_similarity(
                        self.item_vectors[idx_target].reshape(1, -1),
                        self.item_vectors[idx_like].reshape(1, -1)
                    )[0][0]
                    if sim > best_sim:
                        best_sim = sim
                        best_like = m
            if best_like and best_sim > 0.2:
                reasons.append(f"Similar to what you liked: {best_like}")
        except Exception:
            pass
        # Rating prior
        if info.get('rating', 0) >= 4.5:
            reasons.append("Highly rated")
        return reasons

    def recommend(self, user_data, search_data, watch_data, n=12):
        """Profile-based hybrid with diversity (MMR), jitter and exploration"""
        try:
            profile, liked, disliked = self._build_user_profile(user_data, watch_data, search_data)
            titles = list(MOVIE_DATABASE.keys())
            # If profile empty, return top-rated with light shuffle for freshness
            if np.linalg.norm(profile) == 0:
                ranked = sorted(titles, key=lambda t: MOVIE_DATABASE[t]['rating'], reverse=True)
                block = ranked[:max(n * 2, 12)]
                rng = random.Random(datetime.now().timestamp())
                rng.shuffle(block)
                block = block[:n]
                return [{'title': t, 'score': MOVIE_DATABASE[t]['rating'], 'reasons': ['Top rated']} for t in block]

            # Base scoring per item
            base_scores = []  # (title, score, reasons, idx)
            for t in titles:
                if t in liked or t in disliked:
                    continue
                idx = self.title_to_index[t]
                item_vec = self.item_vectors[idx]
                sim = float(cosine_similarity(profile.reshape(1, -1), item_vec.reshape(1, -1))[0][0])
                rating_prior = (MOVIE_DATABASE[t]['rating'] - 3.0) / 2.0
                w = watch_data.get(t, {})
                c = w.get('count', 0)
                secs = float(w.get('seconds', 0.0))
                watch_boost = min(0.2 * np.log1p(secs / 60.0) + 0.1 * c, 0.8)
                search_boost = 0.0
                for q, data in search_data.items():
                    hit = (t.lower() in q) or any(k in q for k in [kw.lower() for kw in MOVIE_DATABASE[t]['keywords']])
                    if hit:
                        search_boost += min(data.get('count', 0) * 0.05, 0.25)
                dislike_penalty = 0.0
                alpha, beta, gamma, delta, eta = 0.6, 0.1, 0.25, 0.15, 0.4
                score = alpha*sim + beta*rating_prior + gamma*watch_boost + delta*search_boost - eta*dislike_penalty
                reasons = self._explain_for_item(t, liked)
                if search_boost > 0:
                    reasons.append("Related to your searches")
                if watch_boost > 0:
                    reasons.append("You watch similar content often")
                base_scores.append((t, score, reasons, idx))

            if not base_scores:
                top = sorted(MOVIE_DATABASE.items(), key=lambda x: x[1]['rating'], reverse=True)[:n]
                return [{'title': t, 'score': v['rating'], 'reasons': ['Top rated'] } for t, v in top]

            # Add small jitter so close items rotate across refreshes
            rng_np = np.random.default_rng()
            sigma = 0.03
            jittered = [(t, s + float(rng_np.normal(0, sigma)), r, idx) for (t, s, r, idx) in base_scores]
            jittered.sort(key=lambda x: x[1], reverse=True)

            # MMR diversity selection from a larger pool
            lambda_mmr = 0.7
            selected = []
            selected_vecs = []
            pool = jittered[:max(2 * n, 20)]

            def mmr_score(item):
                _, s, _, idx = item
                x = self.item_vectors[idx]
                if not selected_vecs:
                    return s
                max_sim = max(float(cosine_similarity(x.reshape(1, -1), sv.reshape(1, -1))[0][0]) for sv in selected_vecs)
                return lambda_mmr * s - (1 - lambda_mmr) * max_sim

            while pool and len(selected) < n:
                best = max(pool, key=mmr_score)
                pool.remove(best)
                t, s, r, idx = best
                selected.append((t, s, r, idx))
                selected_vecs.append(self.item_vectors[idx])

            # Small exploration: occasionally swap in a high-rated unseen item
            if titles and selected and rng_np.random() < 0.25:
                seen = {t for (t, _, _, _) in selected} | set(liked) | set(disliked)
                unseen = [t for t in titles if t not in seen]
                if unseen:
                    pick_pool = sorted(unseen, key=lambda t: MOVIE_DATABASE[t]['rating'], reverse=True)[:6]
                    if pick_pool:
                        pick = pick_pool[int(rng_np.integers(0, len(pick_pool)))]
                        selected[-1] = (pick, MOVIE_DATABASE[pick]['rating'], ['Exploration pick', 'Highly rated'], self.title_to_index[pick])

            return [{'title': t, 'score': round(float(s), 3), 'reasons': r} for (t, s, r, _) in selected[:n]]
        except Exception as e:
            # Fallback to highest rated movies
            top = sorted(MOVIE_DATABASE.items(), key=lambda x: x[1]['rating'], reverse=True)[:n]
            return [{'title': t, 'score': v['rating'], 'reasons': ['Top rated'] } for t, v in top]

# Initialize AI engine
ai_engine = MovieRecommendationAI()

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
    """Get AI-generated recommendations"""
    try:
        user_data = load_json_file(USER_DATA_FILE)
        search_data = load_json_file(SEARCH_DATA_FILE)
        watch_data = load_json_file(WATCH_DATA_FILE)
        # Enhanced recommender with diversity and jitter
        items = ai_engine.recommend(user_data, search_data, watch_data, n=12)
        return jsonify({
            'status': 'success',
            'recommendations': [it['title'] for it in items],
            'itemsDetailed': items,
            'algorithm': 'profile_content_hybrid_v2_mmr_jitter'
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