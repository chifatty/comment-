// Global variables
var user_id = null;
var user_name = null;
var port = null;        // Communication port to backgroud.js

// Control variables
var timer_c = null;
var timer_u = null;



// Prepend haskey to empty comment textarea
var add_hashkey = function (comment) {
    var text = comment.find('textarea.docos-input-textarea');
    var user_id = comment.find('div.docos-anchoredreplyview-author').attr('data-userid');
    if (text.val() == '') {
        var time = new Date();
        var hashkey = '#' + Sha256.hash(user_id + time.valueOf()).substring(0, 10) + ' ';
        text.val(hashkey);
    }
}


// Send +/- 1 to server
var aggrement_modification = function (comment_id, type) {
    var time = new Date();
    var timestamp = time.valueOf();
    var packet = {
        'type': type,
        'comment_id': comment_id,
        'user_id': user_id,
        'user_name': user_name,
        'timestamp': timestamp
    }
    port.postMessage(packet);
}


// handle agree buttion event
var aggre_buttion_event = function (event) {
    var $this = $(this);
    var comment_id = $this.attr('data-comment-id');
    var counter = parseInt($this.text().substring(2));
    var member = JSON.parse($this.attr('data-members'));
    if ($this.hasClass('btn-default')) {
        if (member.indexOf(user_id) < 0) {
            counter += 1;
        }
        $this.removeClass('btn-default');
        $this.addClass('btn-primary');
        aggrement_modification(comment_id, 'plus');
    }
    else {
        counter = Math.max(0, counter - 1);
        $this.removeClass('btn-primary');
        $this.addClass('btn-default');
        aggrement_modification(comment_id, 'minus');
    }
    $this.text('+ ' + counter);
    event.stopPropagation();
    event.stopImmediatePropagation();
}


// Add 'agree' buttion to comment
var add_aggre_button = function (comment) {
    var time = new Date();
    var rootreply = comment.find('div.docos-docoview-rootreply');
    var body = rootreply.find('div.docos-collapsible-replyview');
    var comment_author_id = rootreply.find('div.docos-author').attr('data-userid');
    var comment_author_name = rootreply.find('div.docos-author').text();
    var comment_id = body.find('div.docos-replyview-body').text().substring(0, 11);
    var comment_content = body.find('div.docos-replyview-body').text().substring(12);
    var button_holder = rootreply.find('td.docos-anchoredreplyview-buttonholder');
    var counter = $('<div class="btn btn-default counter"> + 0</div>');
    
    comment.attr('data-timestamp', time.valueOf());
    comment.attr('data-author-id', comment_author_id);
    comment.attr('data-author-name', comment_author_name);
    comment.attr('data-comment-id', comment_id);
    comment.attr('data-comment-content', comment_content);
    
    counter.attr('data-comment-id', comment_id);
    button_holder.children().first().replaceWith(counter);
    
    comment.on('click', 'div.btn', aggre_buttion_event);
}


// Log new detected comment to server
var log_comment = function (comment) {
    var timestamp = comment.attr('data-timestamp');
    var author_id = comment.attr('data-author-id');
    var author_name = comment.attr('data-author-name');
    var comment_id = comment.attr('data-comment-id');
    var comment_content = comment.attr('data-comment-content');
    var packet = {
        'type': 'comment',
        'comment_id': comment_id,
        'comment_content': comment_content,
        'author_id': author_id,
        'author_name': author_name,
        'timestamp': timestamp
    }
    port.postMessage(packet);
}

// Query counter update from server
var query_counter_update = function (comment) {
    var body = comment.find('div.docos-docoview-rootreply').find('div.docos-collapsible-replyview');
    var comment_id = body.find('div.docos-replyview-body').text().substring(0, 11);
    var packet = {
        'type': 'query',
        'comment_id': comment_id
    }
    port.postMessage(packet);
}


// Monitoring comment behavior
var monitor_comment = function() {
    var root = $('div.docos.docos-stream-view')

    // Prepend hashkey to current editing comment
    var comments = root.find('div.docos-docoview.docos-anchoreddocoview:not(.docos-docoview-resolve-button-visible)');
    for (var index = 0; index < comments.length; index++) {
        var comment = comments.eq(index);
        add_hashkey(comment);
    }

    // Add aggre buttion to newly detected comments
    var comments = root.find('div.docos-docoview.docos-anchoreddocoview.docos-docoview-resolve-button-visible:not(.tracking)');
    for (var index = 0; index < comments.length; index++) {
        var comment = comments.eq(index);
        add_aggre_button(comment);
        log_comment(comment);
        comment.addClass('tracking');
    }

    // Tracking system update on all comments
    var comments = root.find('div.docos-docoview.docos-anchoreddocoview.docos-docoview-resolve-button-visible');
    for (var index = 0; index < comments.length; index++) {
        var comment = comments.eq(index);
        query_counter_update(comment);
    }
}


// Extract the current user id
var extract_user_id = function () {
    var scripts = $('script');
    for (var i = 0; i < scripts.length; i++) {
        var text = scripts.eq(i).text();
        var target = text.indexOf('"docs-pid":"')
        if (target > 0) {
            text = text.substring(target + 12);
            var poe = text.indexOf('"');
            user_id = text.substring(0, poe);
            break;
        }
    }
    user_name = $('div#docs-header').find('div.gb_3a').text();
    if (user_id && user_name) {
        console.log(user_id);
        console.log(user_name);
        clearInterval(timer_u);
    }
}


// Handle response from server
// Update counter status
var server_response_handler = function (request, sender, sendResponse) {
    if (request['comment_id'] != undefined) {
        var comment_id = request['comment_id'];
        var members = request['members'];
        var counter = $('div.counter[data-comment-id=' + comment_id + ']')
        if (members.indexOf(user_id) >= 0) {
            counter.removeClass('btn-default');
            counter.addClass('btn-primary');
            counter.text('+ ' + members.length);
        }
        else {
            counter.addClass('btn-default');
            counter.removeClass('btn-primary');
            counter.text('+ ' + Math.max(0, members.length));  
        }
        counter.attr('data-members', JSON.stringify(members));
    } 
}


var main = function () {
    console.log('Crowd Critique loaded');
    port = chrome.runtime.connect({name: "comment++"});
    chrome.runtime.onMessage.addListener(server_response_handler);
    timer_u = setInterval(extract_user_id, 3000);
    timer_c = setInterval(monitor_comment, 1000);
}

main();