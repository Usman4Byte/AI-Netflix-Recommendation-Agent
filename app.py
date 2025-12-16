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
        self.tfidf_vectorizer = TfidfVectorizer()
        self.scaler = StandardScaler()
        self.setup_content_based_features()
    
    def create_movies_dataframe(self):
        """Convert movie database to pandas DataFrame"""
        movies_data = []
        for title, info in MOVIE_DATABASE.items():
            movies_data.append({
                'title': title,
                'genres': ' '.join(info['genres']),
                'year': info['year'],
                'rating': info['rating'],
                'keywords': ' '.join(info['keywords']),
                'director': info['director']
            })
        return pd.DataFrame(movies_data)
    
    def setup_content_based_features(self):
        """Setup TF-IDF vectors for content-based filtering"""
        # Combine genres and keywords for content analysis
        content_features = self.movies_df['genres'] + ' ' + self.movies_df['keywords']
        self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(content_features)
        
        # Setup numerical features (year, rating)
        numerical_features = self.movies_df[['year', 'rating']].values
        self.numerical_features_scaled = self.scaler.fit_transform(numerical_features)
    
    def get_user_preferences_vector(self, user_data):
        """Create user preference vector based on likes/dislikes"""
        liked_movies = []
        disliked_movies = []
        
        for movie, prefs in user_data.get('preferences', {}).items():
            if prefs.get('liked', False):
                liked_movies.append(movie)
            elif prefs.get('disliked', False):
                disliked_movies.append(movie)
        
        return liked_movies, disliked_movies
    
    def calculate_content_similarity(self, target_movie_idx):
        """Calculate content-based similarity scores"""
        movie_tfidf = self.tfidf_matrix[target_movie_idx]
        content_similarities = cosine_similarity(movie_tfidf, self.tfidf_matrix).flatten()
        
        # Also consider numerical features
        movie_numerical = self.numerical_features_scaled[target_movie_idx].reshape(1, -1)
        numerical_similarities = cosine_similarity(movie_numerical, self.numerical_features_scaled).flatten()
        
        # Combine both similarities (70% content, 30% numerical)
        combined_similarities = 0.7 * content_similarities + 0.3 * numerical_similarities
        return combined_similarities
    
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
    
    def generate_recommendations(self, user_data, search_data, watch_data, num_recommendations=6):
        """Generate AI-powered movie recommendations"""
        try:
            liked_movies, disliked_movies = self.get_user_preferences_vector(user_data)
            genre_preferences = self.get_genre_preferences(liked_movies, disliked_movies)
            watch_scores = self.calculate_watch_time_boost(watch_data)
            
            # Get all movie titles
            all_movies = list(MOVIE_DATABASE.keys())
            recommendations = {}
            
            # If user has no preferences, return popular movies
            if not liked_movies and not genre_preferences:
                sorted_movies = sorted(MOVIE_DATABASE.items(), 
                                     key=lambda x: x[1]['rating'], reverse=True)
                return [movie[0] for movie in sorted_movies[:num_recommendations]]
            
            # Calculate scores for each movie
            for movie in all_movies:
                if movie in liked_movies or movie in disliked_movies:
                    continue  # Skip already rated movies
                
                score = 0
                movie_info = MOVIE_DATABASE[movie]
                
                # Genre preference score
                genre_score = 0
                for genre in movie_info['genres']:
                    genre_score += genre_preferences.get(genre, 0)
                score += genre_score * 0.4
                
                # Content similarity score (if we have liked movies)
                if liked_movies:
                    similarity_scores = []
                    movie_idx = self.movies_df[self.movies_df['title'] == movie].index[0]
                    
                    for liked_movie in liked_movies:
                        if liked_movie in self.movies_df['title'].values:
                            liked_idx = self.movies_df[self.movies_df['title'] == liked_movie].index[0]
                            similarity = self.calculate_content_similarity(liked_idx)[movie_idx]
                            similarity_scores.append(similarity)
                    
                    if similarity_scores:
                        avg_similarity = np.mean(similarity_scores)
                        score += avg_similarity * 0.3
                
                # Watch time boost
                score += watch_scores.get(movie, 0) * 0.2
                
                # Rating boost (normalize to 0-1 scale)
                rating_boost = (movie_info['rating'] - 3.0) / 2.0  # Assuming ratings 3-5
                score += rating_boost * 0.1
                
                # Search history boost
                search_count = 0
                for query, data in search_data.items():
                    if movie.lower() in query.lower() or any(keyword in query.lower() for keyword in movie_info['keywords']):
                        search_count += data.get('count', 0)
                
                if search_count > 0:
                    score += min(search_count * 0.1, 0.3)  # Cap search boost
                
                recommendations[movie] = score
            
            # Sort by score and return top recommendations
            sorted_recommendations = sorted(recommendations.items(), 
                                          key=lambda x: x[1], reverse=True)
            
            return [movie[0] for movie in sorted_recommendations[:num_recommendations]]
            
        except Exception as e:
            print(f"Error generating recommendations: {e}")
            # Fallback to highest rated movies
            sorted_movies = sorted(MOVIE_DATABASE.items(), 
                                 key=lambda x: x[1]['rating'], reverse=True)
            return [movie[0] for movie in sorted_movies[:num_recommendations]]

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

@app.route('/api/get-recommendations', methods=['GET'])
def get_recommendations():
    """Get AI-generated recommendations"""
    try:
        user_data = load_json_file(USER_DATA_FILE)
        search_data = load_json_file(SEARCH_DATA_FILE)
        watch_data = load_json_file(WATCH_DATA_FILE)
        
        recommendations = ai_engine.generate_recommendations(
            user_data, search_data, watch_data, num_recommendations=6
        )
        
        return jsonify({
            'status': 'success',
            'recommendations': recommendations,
            'algorithm': 'hybrid_collaborative_content_based'
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