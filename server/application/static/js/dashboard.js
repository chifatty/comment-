(function($) {
    // Global variables
    var socket = null;
    var namespace = '/dashboard';
    var sentiments = {};
    var chats = {};
    var users = {};
    var messages = {};
    var chat_template;
    var message_templatate;

    // Control variables
    var selected_chat = null;
    var latest_timestamp = 0;
    var processing = false;
    var noise_ration = 0.2;

    socket = io.connect(location.origin + namespace);

    socket.on('connect', function (message) {
        if (message) {
            sentiments = JSON.parse(message);
        }
    });

    socket.on('chats', function (message) {
        var response = JSON.parse(message);
        var chatlist = $("#chat-list");
        for (key in response) {
            chat = response[key];
            if (!(key in chats)) {
                var html = chat_template(chat);
                chatlist.append(html);
            }
            users[chat['user_id_1']] = {
                user_name: chat['user_name_1'],
                user_image: chat['user_image_1']};
            users[chat['user_id_2']] = {
                user_name: chat['user_name_2'],
                user_image: chat['user_image_2']};
            chats[key] = chat;
        }
    });

    socket.on('messages', function (message) {
        var response = JSON.parse(message);
        var chat_id = response['chat_id'];
        var messages = response['messages'];
        if (chat_id == selected_chat) {
            var messages = response['messages'];
            for (var i = 0; i < messages.length; i++) {
                var msg_id = messages[i]['msg_id'];
                var timestamp = messages[i]['timestamp'];
                if (timestamp > latest_timestamp) {
                    latest_timestamp = timestamp;
                }
                if (!(msg_id in messages)) {
                    chats[msg_id] = messages[i];
                    post_message(messages[i]);
                }
            }
            if (messages.length > 0) {
                $('html, body').animate({ scrollTop: $('table#message-list').height() }, 10);
            }
        }
        processing = false;
    });

    var post_message = function (message) {
        var data = JSON.stringify(message);
        var msg_id = message['msg_id'];
        var sender_image = users[message['sender']]['user_image'];
        var content = message['content'];
        var options = $.extend(true, {}, sentiments);

        if (message.sentiment) {
            for (var key in options) {
                options[key]['disabled'] = true;
                if (message.sentiment == options[key]['name']) {
                    options[key]['selected'] = true;    
                }
            }
        }
        var html = message_template({sentiments: options, 
                                     data: data, msg_id: msg_id,
                                     sender_image: sender_image,
                                     content: content});
        var list = $('table#message-list > tr');
        if (list.length == 0) {
            $('table#message-list').append(html);
        }
        else {
            for (var i = list.length - 1; i >= 0; i--) {
                var pivot = list.eq(i).attr('data-msg-id');
                if (pivot < msg_id) {
                    $(html).insertAfter(list.eq(i));
                    break;
                }
            }
        }
    }

    var chat_selection = function () {
        $('#chat-list').on('click', 'li', function () {
            var $this = $(this);
            var chat_id = $this.attr('data-chat-id');
            $('#chat-list > li').removeClass('active');
            $('table#message-list').empty();
            $this.addClass('active');
            selected_chat = chat_id;
            latest_timestamp = 0;
            messages = {};
            socket.emit('polling_message', {chat_id: chat_id, max: latest_timestamp});
        });
    }

    var noisy_sentiment = function (sentiment) {
        var length = sentiments.length;
        var index = 0;
        for (var key in sentiments) {
            if (sentiments[key]['name'] == sentiment) {
                index = parseInt(key);
                break;
            }
        }
        index += Math.floor(Math.random() * (length - 1));
        index += 1;
        index %= length;
        return sentiments[index]['name'];
    }

    var sentiment_selection = function () {
        $('#message-list').on('click', 'button', function (e) {
            var now = new Date();
            var timestamp = now.valueOf();
            var sentiment = $(this).val();
            var data = JSON.parse($(this).parent().attr('data-chatmood'));
            $(this).removeClass('btn-default').addClass('btn-primary ');
            $(this).parent().find('button').attr('disabled', 'disabled');
            if (Math.random() < noise_ration) {
                var origin = sentiment;
                sentiment = noisy_sentiment(sentiment);
                console.log(origin + ' -> ' + sentiment);
            }
            data['sentiment'] = sentiment;
            data['update_by'] = 'dashboard';
            data['update_at'] = timestamp;
            socket.emit('update_sentiment', data);
        });
    }

    var init = function () {
        chat_selection();
        sentiment_selection();
        chat_template = Handlebars.compile($('#chat-template').html());
        message_template = Handlebars.compile($('#message-template').html());
    }

    var loop = function () {
        socket.emit('polling_chats');
        if (selected_chat != null && processing != true) {
            processing = true;
            socket.emit('polling_message', {chat_id: selected_chat, max: latest_timestamp});
        }
    }

    init();
    loop();
    setInterval(loop, 1000);
})(jQuery);
