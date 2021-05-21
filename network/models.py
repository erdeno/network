from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    profile_photo = models.CharField(max_length=280)

    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "profile_photo": self.profile_photo,
            "following": [],
            "followers": [],
            "tweets": [],
            "likes": [],
        }


class Following(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="follower")
    following_user = models.ManyToManyField("User", related_name="followingUser")


class Tweet(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="tweeter")
    content = models.TextField(blank=True)
    likers = models.ManyToManyField("User", related_name="likers", blank=True)
    comments = models.ManyToManyField("Comment", related_name="comments", blank=True)
    date = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "user_id": self.user.id,
            "content": self.content,
            "likers": [user.username for user in self.likers.all()],
            "comments": [comment.id for comment in self.comments.all()],
            "date": self.date.strftime("%b %d %Y, %I:%M %p"),
            "user_profile_photo": self.user.profile_photo,
            "total_pages": "",
        }


class Comment(models.Model):
    user = models.ForeignKey("User", on_delete=models.PROTECT, related_name="commenter")
    commented_tweet = models.ForeignKey(
        "Tweet", on_delete=models.PROTECT, related_name="commented_tweet"
    )
    comment_content = models.TextField(blank=True)
    date = models.DateTimeField(auto_now_add=True)
