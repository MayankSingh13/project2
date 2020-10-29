document.addEventListener('DOMContentLoaded', () => {
  var socket = io.connect('http://' + document.domain + ':' + location.port);


  socket.on('connect', () => {
    if(!localStorage.getItem('displayname')) {
      document.querySelector('#first').style.display = 'block';
      document.querySelector('#main').style.display = 'none';
      document.querySelector('#login').onsubmit = () => {
        let displayname = document.querySelector('#displayname').value;
        localStorage.setItem('displayname', displayname);
      }
      //set the default channel to general.
      localStorage.setItem('currentchannel', 'general');
      //socket.emit('after login', localStorage.getItem('currentchannel'), localStorage.getItem('displayname'));
    }
    else {
        document.querySelector('#first').style.display = 'none';
        document.querySelector('#main').style.display = 'block';
        document.querySelector('#display').innerHTML = localStorage.getItem('displayname');
        document.querySelector('#submit').disabled = true;
        //get the last channel used.
        socket.emit('after login', localStorage.getItem('currentchannel'), localStorage.getItem('displayname'));
    }

  });

  //enable the button when some text is entered.
  document.querySelector('#channels').onkeyup = () => {
      if (document.querySelector('#channels').value.length > 0)
          document.querySelector('#submit').disabled = false;
      else
          document.querySelector('#submit').disabled = true;
  };

  //new channel creation.
  document.querySelector('#new_channel').onsubmit = () => {
    const newchannel = document.querySelector("#channels").value;
    socket.emit('channel creation', newchannel);
    document.querySelector('#channels').value = '';
    document.querySelector('#submit').disabled = true;
    // Stop form from submitting
    return false;
  };

  //error handling.
  socket.on('channel error', data => {
    console.log(data);
    alert(data);
  });

  // message about channel creation
  socket.on('channel created', message => {
    var p = document.createElement('p');
    //p.innerHTML = message;
    p.innerHTML = 'New channel created in the list.';
    document.querySelector('#channel_message').append(p);
    var li = document.createElement('li');
    li.innerHTML = message;
    li.setAttribute('data-channel', message);
    console.log(message);
    console.log(li.dataset.channel);
    document.querySelector('#channel_name').append(li);
    //window.location.reload();
  });

  //click channel name to select it.
  document.querySelectorAll("#channel_name").forEach(li => {
      li.onclick = () => {
        alert(li.dataset.channel);
        oldchannel = localStorage.getItem('currentchannel');
        console.log(oldchannel);
        localStorage.setItem('currentchannel', li.dataset.channel);
        socket.emit('join channel', localStorage.getItem('displayname'), li.dataset.channel, oldchannel);
        //return false;
      };
  });

  socket.on('message', data => {
    console.log(`Message : ${data['text']}`);
    var p = document.createElement('p');
    p.innerHTML = data['text'];
    console.log(p);
    document.querySelector('#channel_message').append(p);
    var sup = document.createElement('sup');
    sup.innerHTML = data['my_time'];
    p.setAttribute('margin', '0');
    document.querySelector("#channel_message").append(sup);
  });

  socket.on('channel header', message => {
    //document.querySelector("#channel_message").innerHTML = "";
    document.querySelector('#channel_message').style.display = 'block';
    document.querySelector('#room_name').innerHTML = message;
  });

  //sending new message.
  document.querySelector('#chat_box').onsubmit = () => {
    const chatmessage = document.querySelector("#send_block").value;
    current_channel = localStorage.getItem('currentchannel');
    username = localStorage.getItem('displayname');
    socket.emit('send message', chatmessage, current_channel, username);
    document.querySelector('#send_block').value = '';
    document.querySelector('#submit').disabled = true;
    // Stop form from submitting
    return false;
  };

  //show the messages in the new channel the user joins.
  socket.on('show message', data => {
    console.log(`Message : ${data['message']}`);
    if (data['user'] == localStorage.getItem('displayname')){
      //clear the message block.
      document.querySelector("#channel_message").innerHTML = "";
      var msg;
      //search for the messages stored in the server on the current channel.
      for (msg in data['message']) {
        var p = document.createElement('p');
        p.innerHTML = data['message'][msg];
        document.querySelector('#channel_message').append(p);
      }
      //give channel entering message to the local user.
      var str1 = '< ';
      var str2 = data['user'];
      var str3 = ' > has entered the channel';
      var str = str1.concat(str2, str3);
      var p = document.createElement('p');
      p.innerHTML = str;
      document.querySelector('#channel_message').append(p);
      var sup = document.createElement('sup');
      sup.innerHTML = data['my_time'];
      p.setAttribute('margin', '0');
      document.querySelector("#channel_message").append(sup);
    }
  });

  //add the new message sent by someone on the message block.
  socket.on('new message', data => {
    console.log(`Message : ${data['user']}`);
    var p = document.createElement('p');
    p.innerHTML = data['message'];
    document.querySelector('#channel_message').append(p);
    var sup = document.createElement('sup');
    sup.innerHTML = data['user'] + ', ' + data['my_time'];
    p.setAttribute('margin', '0');
    document.querySelector("#channel_message").append(sup);
  });
});
