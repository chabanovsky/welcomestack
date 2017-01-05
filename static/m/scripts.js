var server_url = "localhost";
var stackoverflow_url = "http://ru.stackoverflow.com";
var tracking_code = "?utm_source=demo.stackoverflow.ru&utm_campaign=welcometostack";
var init_service_url = "/json/users/init";
var service_url = "/json/users";

var post_type_answer = "answer";
var post_type_question = "question";
var post_type_comment = "comment";

var answer_strings = ["ответ", "ответа", "ответов"];
var score_strings = ["голос", "голоса", "голосов"];
var view_strings = ["показ", "показа", "показов"];

var posts_symbols;
var posts_commands;

var usersList = {
    users: [],
    current: 0
};

$(function() {
    init();
    var users_root = $("#users_root");
});

function init() {
    posts_symbols = new Array(post_type_answer, post_type_question, post_type_comment);
    posts_symbols[post_type_answer] = ["О", "отвечен"];
    posts_symbols[post_type_question] = ["В", "задан"];
    posts_symbols[post_type_comment] = ["К", "прокомментирован"];

    requestUsers();
    initEditor();
    initArrows();

    $("#ask_question").attr("href", stackoverflow_url + "/questions/ask/" + tracking_code);
    $("#logo a").attr("href", stackoverflow_url + tracking_code);
}

function initEditor() {
    var buttons = $(".button_row .button");
    var step = 20;
    var space_added = 0;
    for (var i = 0; i < buttons.length; i++) {
        var button = buttons[i];
        var add_space = 0;
        if (i == 0) {
            add_space = 0;
        } else if (i == 2 || i == 8 || i == 12) {
            add_space = 2 * (step + 5);
        } else {
            add_space = step + 5;
        }
        space_added += add_space;
        $(button).attr("style", "left: " + space_added + "px;");

        function doIt(span, img_pos_x) {
            $(span).attr("style", "background-position: " + img_pos_x + "px 0px;");

            $(span).hover(function() {
                $(span).attr("style", "background-position: " + img_pos_x + "px -40px;");
            }, function() {
                $(span).attr("style", "background-position: " + img_pos_x + "px 0px;");
            });
        };
        doIt($(button).find("span"), (i * step * -1));
    }

    $(buttons[buttons.length - 1]).attr("style", "right: 0px;");
}

function requestUsers() {
    $("#user_section").css("display", "none");
    $.get(init_service_url, function(data) {
        createUsersFeed(data);
        $("#user_section").css("display", "block");
        $.get(service_url, function(data) {
            createUsersFeed(data);
        });
    });
}

function initArrows() {
    $("#left_arrow").click(leftArroClick);
    $("#right_arrow").click(rightArroClick);
    updateArrows();
}

function updateArrows() {
    if (usersList.users.length > 1) {
        $("#left_arrow").css("display", "block");
        $("#right_arrow").css("display", "block");
    } else {
        $("#left_arrow").css("display", "none");
        $("#right_arrow").css("display", "none");
    }
}

function leftArroClick() {
    var currentIndex = usersList.current;
    var newIndex = -1;
    if (currentIndex == 0) {
        newIndex = usersList.users.length - 1;
    } else {
        newIndex = currentIndex - 1;
    }
    displayUser(newIndex);
    usersList.current = newIndex;
}

function rightArroClick() {
    var currentIndex = usersList.current;
    var newIndex = -1;
    if (currentIndex >= usersList.users.length - 1) {
        newIndex = 0;
    } else {
        newIndex = currentIndex + 1;
    }
    displayUser(newIndex);
    usersList.current = newIndex;
}

function createUsersFeed(users) {
    for (index = 0; index < users.length; index++) {
        var is_existed = false;
        user = users[index];
        for (sub_index = 0; sub_index < usersList.users.length; sub_index++) {
            if (usersList.users[sub_index].id == user.id) {
                is_existed = true;
                break;
            }
        }
        if (!is_existed) {
            usersList.users.push(user);
        }
    }

    if (usersList.users.length > 0)
        displayUser(0);
    updateArrows();
}

function displayUser(index) {
    var user = usersList.users[index];

    $("#user_profile").attr("href", stackoverflow_url + "/users/" + user.id + tracking_code);
    $("#avatar").attr("src", user.avatar);
    $("#username").text(user.username);
    $("#reputation").text(user.reputation);

    var answers = user.answers;
    var answer_html = "";
    for (var i = 0; i < answers.length; i++) {
        var answer = answers[i];
        var tmp = answerTemplate();
        var template = $(tmp);
        var link = stackoverflow_url + "/a/" + answer.id + "/" + tracking_code;
        template.find(".answer").attr("onclick", "window.location.href='" + link + "'");
        template.find(".score").text(answer.score);
        template.find(".title").text(answer.title);
        template.find(".title").attr("href", link);
        answer_html += template.html();
    }
    $("#answer_root").empty();
    $("#answer_root").html(answer_html);

    var tags = user.tags;
    var tag_html = "";
    for (var i = 0; i < tags.length; i++) {
        var tag = tags[i];
        var tmp = tagTemplate();
        var template = $(tmp);
        template.find(".post_tag").text(tag);
        tag_html += template.html();
    }
    $("#tag_root").empty();
    $("#tag_root").html(tag_html);
}

function answerTemplate() {
    return '<div><div class="answer"><span class="score"></span><a class="title"></a></div></div>';
}

function tagTemplate() {
    return '<div><span class="post_tag"></span></div>';
}