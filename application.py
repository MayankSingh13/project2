import os
import requests
import time

from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit, send, join_room, leave_room

app = Flask(__name__)
app.config["SECRET_KEY"] = 'my secret'
socketio = SocketIO(app)

channels = ['general']
messages = {}

@app.route("/")
def index():
    return render_template("index.html", channels=channels)

@socketio.on('after login')
def login(defaultchannel, username):
    current_channel = defaultchannel
    join_room(current_channel)
    print(username)
    #if username == None:
        #username = ' '
    time_result = time.localtime(time.time())
    my_time = time.strftime("%d %b'%Y, %I:%M %p", time_result)
    text = my_time + ' < ' + username + ' > has entered the channel.'
    print(my_time)
    print(text)
    message = 'Current channel: ' + current_channel
    send(text, room=current_channel)
    emit('channel header', message)
    #check the messages dictionary of the joined channel.
    key = current_channel
    messages.setdefault(key, [])
    print(current_channel)
    print(messages[current_channel])
    data = {'channel': current_channel, 'user': username, 'message': messages[current_channel], 'my_time': my_time}
    emit('show message', data, room=current_channel)

@socketio.on('channel creation')
def channel_creation(newchannel):
    if newchannel in channels:
        msg = "Channel name " + newchannel + " is already in use."
        emit('channel error', msg)
    else:
        channels.append(newchannel)
        #emit('channel created', 'New channel created in the list. Reload page to see.', broadcast=True)
        emit('channel created', newchannel, broadcast=True)

@socketio.on('join channel')
def on_join(username, current_channel, old_channel):
    # add the user to the channel
    time_result = time.localtime(time.time())
    my_time = time.strftime("%d %b'%Y, %I:%M %p", time_result)
    text = '< ' + username + ' > has left the channel.'
    data = {'text': text, 'my_time': my_time}
    leave_room(old_channel)
    send(data, room=old_channel)
    join_room(current_channel)
    message = 'Current channel: ' + current_channel
    emit('channel header', message)
    #broadcast channel entering message to every one.
    text = '< ' + username + ' > has entered the channel.'
    data = {'text': text, 'my_time': my_time}
    send(data, room=current_channel)
    #create a messages dictionary of the created channel.
    key = current_channel
    messages.setdefault(key, [])
    data = {'channel': current_channel, 'user': username, 'message': messages[current_channel], 'my_time': my_time}
    emit('show message', data, room=current_channel)

@socketio.on('send message')
def new_message(message, current_channel, username):
    #add the new message to messages dict.
    join_room(current_channel)
    time_result = time.localtime(time.time())
    my_time = time.strftime("%d %b'%Y, %I:%M %p", time_result)
    key = current_channel
    messages.setdefault(key, [])
    print(len(messages[key]))
    if len(messages[key]) > 100:
        messages[key].pop(0)
        messages[key].append(message)
    else:
        messages[key].append(message)
    print(messages[current_channel])
    data = {'user': username, 'message': message, 'my_time': my_time}
    emit('new message', data, room=current_channel)


if __name__ == '__main__':
    socketio.run(app)
