document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('#index').addEventListener('click', () => load_timeline('all_posts', 1));
    document.querySelector('#following').addEventListener('click', () => load_timeline('following', 1));
    document.querySelector('#new_post').addEventListener('click', () => createNewPost());



    // By default, load the all_posts
    load_timeline('all_posts');



});




// Write create functionality
function createNewPost() {
  document.querySelector('#alert').innerHTML= "";
  document.querySelector("#save-later").innerHTML="";
  document.querySelector("#new-post-header").innerHTML = "Create New Post: ";

  document.querySelector('#profile-view').style.display= "none";
  document.querySelector('#tweets-view').style.display = 'block';
  if (document.querySelector('#new-post').style.display === 'block') {
    document.querySelector('#new-post').style.display = 'none';
  } else {
    document.querySelector('#new-post').style.display = 'block';
  }

  document.querySelector('#compose-body').value = '';

  document.querySelector("form").onsubmit = function() {
    const tweet = document.querySelector("#compose-body").value;


    fetch(`/tweets`, {
      method: 'POST',
      body: JSON.stringify({
            tweet_content: tweet
        })
    })
      .then(response => response.json())
      .then(result => {
          // Print result

          // console.log(result);
          if (result.message) {
              document.querySelector('#alert').innerHTML = `<div class="alert alert-primary" role="alert">
              ${result.message}
              </div>`;
            } else if (result.error){
              document.querySelector('#alert').innerHTML = `<div class="alert alert-danger" role="alert">
              ${result.error}
              </div>`;
            }
          load_timeline('all_posts',1);
      });
  }

  return false;
}

// This function put active class on the clicked nav item in profile.
const make_active = (itemId) => {
  const navLinks = document.querySelectorAll(".profile-nav-link");
  navLinks.forEach((item) => {
    item.classList.remove('active');
  });
  document.querySelector(`#${itemId}`).classList.add('active');
}



async function follow(l_user, f_user) {
  let response = await fetch(`/users/${l_user}`, {
    method: 'PUT',
    body: JSON.stringify({
        follow: f_user
    })
  });

  loadProfile(f_user);

};

async function unfollow(l_user, f_user) {
  let response = await fetch(`/users/${l_user}`, {
    method: 'PUT',
    body: JSON.stringify({
        unfollow: f_user
    })
  });

  loadProfile(f_user);
};


async function getTweetDetail(tweet_id) {
      let response = await fetch(`/tweet/${tweet_id}`); // resolves with response headers
      let result = await response.json();
      return result;
};

var edit_text = {id: "", content: ""};
// Save for later fonksiyonu eklenmesi lazım.
function saveForLater(tweet_id) {
  edit_text.id = tweet_id;
  if (document.querySelector('#compose-body').value.length > 0) {
    edit_text.content = document.querySelector('#compose-body').value;
  }
  document.querySelector('#new-post').style.display = 'none';
}




async function edit(tweet_id) {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  const tweet_detail = await getTweetDetail(tweet_id);
  document.querySelector('#alert').innerHTML= "";

  document.querySelector('#profile-view').style.display= "none";
  document.querySelector('#tweets-view').style.display = 'block';
  document.querySelector('#new-post').style.display = 'block';
  document.querySelector("#new-post-header").innerHTML = "Edit: ";
  document.querySelector("#save-later").innerHTML=`<button type="button" onclick=saveForLater(${tweet_id}) class="btn btn-outline-success"><i class="fa fa-plus-circle"></i> Save for Later</button>`;

  if (edit_text.id === tweet_id) {
    document.querySelector('#compose-body').value = edit_text.content;
  } else {
    document.querySelector('#compose-body').value = tweet_detail.content;
  }

  document.querySelector("form").onsubmit = function() {
    const tweet = document.querySelector("#compose-body").value;
    if (edit_text.id === tweet.id) {
      edit_text.content = "";
    }
    fetch(`tweet/${tweet_id}`, {
      method: 'PUT',
      body: JSON.stringify({
            tweet_content: tweet
        })
    })
    setTimeout(function(){ load_timeline('all_posts',1); }, 500);
    }
  return false;
}


async function like(tweet_id, like) {
      let response = await fetch(`/tweet/${tweet_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            like: like
        })
      });
    var pathname = window.location.hash.slice(1);
    if (pathname=== "all_posts" || pathname ==="following") {
      load_timeline(pathname);
    } else {
      loadProfile(pathname);

    }
};



async function getTweets(display, pagenum) {
      let response = await fetch(`/tweets/${display}/${pagenum}`); // resolves with response headers
      let result = await response.json();
      return result;
};

let num = 1;
let totalPageNum = 1;
function changePage(add=true) {
  const disp = window.location.hash.slice(1);

  if (add)  {
    num ++;
  } else {
    num --;
  }

  if (num <= 1) {
    document.querySelector('#previous-page').classList.add('disabled');
  } else {
    document.querySelector('#previous-page').classList.remove('disabled');
  }

  if (num >= totalPageNum) {
    document.querySelector('#next-page').classList.add('disabled');
  } else {
    document.querySelector('#next-page').classList.remove('disabled');
  }
  load_timeline(disp, num);
}

  // This function displays all_posts or following section depend on the argument.
async function load_timeline(display, pagenum=num) {

  document.querySelector('#current-page').innerHTML = pagenum;


  document.querySelector('#profile-view').style.display= "none";
  document.querySelector('#new-post').style.display = 'none';



  document.querySelector('#alert').innerHTML = '';
  document.querySelector('#tweets-view').style.display = 'block';
  document.querySelector('#pagination').style.display = 'block';
  document.querySelector('#tweets-view').innerHTML = '';

  const logged_user_name = document.querySelector("#user").text;
  const tweets = await getTweets(display, pagenum);
  totalPageNum = tweets[0].total_pages
  if (tweets.length > 0) {
    tweets.forEach((item, i) => {
      const element = document.createElement('div');
          element.innerHTML = `
          <div class="card mb-3" style="max-width: 50rem;">
                <div class="row no-gutters">
                  <div class="col-md-4">
                    <img id="profile_photo" src=${item.user_profile_photo} class="card-img rounded-circle img-fluid" alt="profile_photo">
                  </div>
                  <div class="col-md-8">
                    <div class="card-body">
                      <a onclick=loadProfile('${item.user}') href='#'><h5 class="card-title">@${item.user}</h5></a>
                      <p class="card-text">${item.content}</p>
                      <p class="card-text"><small class="text-muted">${item.date}</small></p>
                      ${
                        (item.user === logged_user_name)?
                        `<button type="button" onclick=edit(${item.id}) class="btn btn-outline-warning"><i class="fa fa-edit"></i> Edit</button>`:''
                      }
                      ${
                        (item.likers.includes(logged_user_name))?
                        `<button type="button" onclick=like(${item.id},false) class="btn btn-outline-danger"><i class="fa fa-heart"></i> ${item.likers.length}</button>`:
                        `<button type="button" onclick=like(${item.id},true) class="btn btn-outline-success"><i class="fa fa-heart"></i> ${item.likers.length}</button>`}
                    </div>
                  </div>
                </div>
              </div>`
        document.querySelector('#tweets-view').append(element);
      });

  } else {
    document.querySelector('#tweets-view').innerHTML = 'There is no tweet yet.';
    }


  window.location.hash = display;
}


  // This function will fetch user details.
  async function userDetails(username) {
        let response = await fetch(`/users/${username}`); // resolves with response headers
        let result = await response.json();
        return result;
  };



  // This function will load an users profile
  async function loadProfile(userName, display=1) {
    document.querySelector('#alert').innerHTML= "";
    document.querySelector('#tweets-view').style.display = 'none';
    document.querySelector('#pagination').style.display = 'none';
    document.querySelector('#new-post').style.display = 'none';


    document.querySelector('#profile-view').style.display = 'block';
    document.querySelector(".profile-tweet-content").innerHTML = "";

    const logged_user_name = document.querySelector("#user").text;
    const logged_user = await userDetails(logged_user_name);
    const page_user = await userDetails(userName);

    document.querySelector("#profile-img").src = page_user.profile_photo;
    document.querySelector(".profile-usertitle-name").innerHTML = page_user.username;
    document.querySelector(".profile-quote").innerHTML = `Follower: ${page_user.followers.length} Follow: ${page_user.following.length}`;


    document.querySelector(".profile-usermenu").innerHTML = `
        <ul id="profile-nav" class="nav d-block">
          <li id="profile-nav-tweet" class="profile-nav-link active" id="tweets-profile">
            <a href="#" onclick=loadProfile("${userName}")>Tweets</a>
          </li>
          <li id="profile-nav-likes" class="profile-nav-link" id="liked-profile">
            <a href="#" onclick=loadProfile("${userName}",2)>Liked Tweets</a>
          </li>
        </ul>`;



    // Follow Unfollow functionality
    if (page_user.username !== logged_user.username) {
      if (logged_user.following.includes(page_user.username)) {
        document.querySelector(".profile-userbuttons").innerHTML =
        `<button onclick=unfollow('${logged_user_name}','${page_user.username}')
        type="button" class="btn btn-danger btn-sm">Unfollow</button>`;
      } else {
        document.querySelector(".profile-userbuttons").innerHTML =
        `<button onclick=follow('${logged_user_name}','${page_user.username}')
        type="button" class="btn btn-success btn-sm">Follow</button>`;
      }
    } else {
        document.querySelector(".profile-userbuttons").innerHTML = "";
    }

    if (display === 1) {
      // console.log("tweets");
      var items = page_user.tweets;
      make_active("profile-nav-tweet");
    } else if (display === 2) {
      var items = page_user.likes;
      make_active("profile-nav-likes");
    }

    if (items.length > 0) {
      items.forEach((tweet, i) => {
        const profile_tweets = document.createElement('div');
        profile_tweets.innerHTML =`
        <div class="card mb-3" style="max-width: 50rem;">
          <div class="row no-gutters">
            <div class="col-md-4">
              <img id="profile_photo_sm" src=${tweet.user_profile_photo} class="card-img rounded img-fluid" alt="profile_photo">
            </div>
            <div class="col-md-8">
              <div class="card-body">
                <h5 class="card-title"><a href="#" onclick=loadProfile("${tweet.user}")>@${tweet.user}</a></h5>
                <p class="card-text">${tweet.content}</p>
                <p class="card-text"><small class="text-muted">${tweet.date}</small></p>
                ${
                  tweet.user === logged_user_name?
                  `<button type="button" onclick=edit(${tweet.id}) class="btn btn-outline-warning"><i class="fa fa-edit"></i> Edit</button>`:''
                }
                ${
                  tweet.likers.includes(logged_user_name)?
                  `<button type="button" onclick=like(${tweet.id},false) class="btn btn-outline-danger"><i class="fa fa-heart"></i> ${tweet.likers.length}</button>`:
                  `<button type="button" onclick=like(${tweet.id},true) class="btn btn-outline-success"><i class="fa fa-heart"></i> ${tweet.likers.length}</button>`
                }
              </div>
            </div>
          </div>
        </div>`;

        document.querySelector(".profile-tweet-content").append(profile_tweets);

      });
    } else {
      document.querySelector(".profile-tweet-content").innerHTML= "There is no tweet yet.";
    }

    window.location.hash = userName;
  }
