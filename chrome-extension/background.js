// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Constants
var SERVER = 'http://disa.csie.ntu.edu.tw:8814/comment++'
// var SERVER = 'http://localhost:8814/comment++'

// Global Variable
var socket = null;

var multi_cast = function (packet) {
    chrome.tabs.query({}, function(tabs) {
        targets = ['https://docs.google.com/document'];
        tabs.forEach(function (element, index, array) {
            targets.forEach(function (e, i, a) {
                if (element.url.indexOf(e) == 0) {
                    chrome.tabs.sendMessage(element.id, packet, null);
                }
            });
        });
    });
}


var server_response_handler = function (packet) {
    console.log(packet);
    packet = JSON.parse(packet);
    if (packet == null ||
        packet == undefined ||
        packet['comment_id'] == undefined || 
        packet['comment_id'].length < 0)
        return;
    multi_cast(packet);
}


var page_request_handler = function (packet) {
    if (socket != null) {
        socket.emit('heartbeat', packet);
    }
}


var main = function() {
    socket = io.connect(SERVER);
    socket.on('response', server_response_handler);
    socket.on('connect', function() {
        console.log('Crowd Critique server connected');
    });
    chrome.runtime.onConnect.addListener(function (port) {
        console.assert(port.name == "comment++");
        port.onMessage.addListener(page_request_handler);
    });
} 

main();