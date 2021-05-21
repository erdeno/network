from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("timeline/all_posts", views.index, name="index"),
    path("timeline/following", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    # API Routes
    path("tweets", views.create_tweet, name="create_tweet"),
    path("tweet/<int:tweet_id>", views.tweet, name="tweet"),
    path("tweets/<str:display>/<int:pageNum>", views.timeline, name="timeline"),
    path("users/<str:user_name>", views.user, name="user"),
    # path("comments/<int:comment_id>", views.comment, name="comment"),
]
