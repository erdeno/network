import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator

from .models import User, Tweet, Comment, Following


def index(request):
    # Authenticated users view their inbox
    if request.user.is_authenticated:
        return render(request, "network/index.html")
    # Everyone else is prompted to sign in
    else:
        return HttpResponseRedirect(reverse("login"))


# bu csrfyi put için ayrı fonksiyon yazınca oraya taşı.
@csrf_exempt
def user(request, user_name):
    try:
        user = User.objects.get(username=user_name)
    except Tweet.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)

    try:
        followings = Following.objects.get(user=user)
    except:
        followings = Following(user=user)
        followings.save()
    followers = Following.objects.filter(following_user=user)

    def get_tweet_details(tweets):
        new_list = list()
        for tweet in tweets:
            temp_dict = dict()
            temp_dict["id"] = tweet.id
            temp_dict["user"] = tweet.user.username
            temp_dict["user_profile_photo"] = tweet.user.profile_photo
            temp_dict["content"] = tweet.content
            temp_dict["likers"] = [liker.username for liker in tweet.likers.all()]
            temp_dict["date"] = tweet.date.strftime("%b %d %Y, %I:%M %p")
            new_list.append(temp_dict)
        return new_list

    if request.method == "GET":
        data = user.serialize()
        if followings:
            data["following"] = [
                following_user.username
                for following_user in followings.following_user.all()
            ]
        if followers:
            data["followers"] = [
                follower_user.user.username for follower_user in followers
            ]
        tweets = Tweet.objects.filter(user=user)
        if tweets:
            tweets = tweets.order_by("-date").all()
            data["tweets"] = get_tweet_details(tweets)
        liked_tweets = Tweet.objects.filter(likers=user)
        if liked_tweets:
            data["likes"] = get_tweet_details(liked_tweets)
        return JsonResponse(data)

    elif request.method == "PUT":
        data = json.loads(request.body)
        if data.get("follow") is not None:
            # bu follow kısmı için ayrıca post view oluşturulabilir.
            follow_user = User.objects.get(username=data["follow"])
            followings.following_user.add(follow_user)
        elif data.get("unfollow") is not None:
            follow_user = User.objects.get(username=data["unfollow"])
            followings.following_user.remove(follow_user)
        return HttpResponse(status=204)

    else:
        return JsonResponse({"error": "GET or PUT request required."}, status=400)


@csrf_exempt
@login_required
def create_tweet(request):
    # Creating a new tweet must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    data = json.loads(request.body)
    tweet_content = data.get("tweet_content")
    if tweet_content == "":
        return JsonResponse({"error": "The tweet can't be empty."}, status=400)

    user = request.user
    tweet = Tweet(user=user, content=tweet_content)
    tweet.save()
    return JsonResponse({"message": "Tweet created successfully."}, status=201)


def timeline(request, display, pageNum):
    if display == "all_posts":
        tweets = Tweet.objects.all()
    elif display == "following":
        if request.user.is_authenticated:
            following_users = [
                followin_user.id
                for followin_user in Following.objects.get(
                    user=request.user
                ).following_user.all()
            ]
            tweets = Tweet.objects.filter(user__in=following_users)
        else:
            return JsonResponse(
                {"error": "You must be authorised for this."}, status=400
            )
    else:
        return JsonResponse({"error": "Invalid display parameter."}, status=400)
    # Return tweets in reverse chronologial order
    tweets = tweets.order_by("-date").all()
    paged_tweets = Paginator([tweet.serialize() for tweet in tweets], 10)
    current_tweets = paged_tweets.page(pageNum).object_list
    current_tweets[0]["total_pages"] = paged_tweets.page_range[-1]

    return JsonResponse(current_tweets, safe=False)


@csrf_exempt
@login_required
def tweet(request, tweet_id):

    # Query for requested tweet
    try:
        tweet = Tweet.objects.get(pk=tweet_id)
    except Tweet.DoesNotExist:
        return JsonResponse({"error": "Tweet not found."}, status=404)

    # Return tweet contents
    if request.method == "GET":
        return JsonResponse(tweet.serialize())

    elif request.method == "PUT":
        data = json.loads(request.body)
        if data.get("like") is not None:
            if data["like"]:
                tweet.likers.add(request.user)
            else:
                tweet.likers.remove(request.user)
        elif data.get("tweet_content") is not None:
            tweet.content = data["tweet_content"]
        tweet.save()
        return HttpResponse(status=204)

    # Email must be via GET or PUT
    else:
        return JsonResponse({"error": "GET or PUT request required."}, status=400)


@csrf_exempt
@login_required
def comment(request, tweet_id):
    try:
        tweet = Tweet.objects.get(pk=tweet_id)
    except Tweet.DoesNotExist:
        return JsonResponse({"error": "Tweet not found."}, status=404)

    if request.method == "POST":
        data = json.loads(request.body)
        comment_content = data.get("comment_content")
        if comment_content == "":
            return JsonResponse({"error": "The comment can't be empty."}, status=400)
        user = request.user
        comment = Comment(
            user=user, commented_tweet=tweet, comment_content=comment_content
        )
        comment.save()
        return JsonResponse({"message": "Comment created successfully."}, status=201)

    elif request.method == "GET":
        c = Comment.objects.filter(commented_tweet=tweet)
        comments = c.order_by("-date").all()
        return JsonResponse([comment.serialize() for comment in comments], safe=False)


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(
                request,
                "network/login.html",
                {"message": "Invalid username and/or password."},
            )
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(
                request, "network/register.html", {"message": "Passwords must match."}
            )

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(
                request, "network/register.html", {"message": "Username already taken."}
            )
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
