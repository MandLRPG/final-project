Router.configure({
  notFoundTemplate: '404error',
  layoutTemplate: 'main'
  //loadingTemplate: 'loading'
});

Chat = new Mongo.Collection("chatlog");

if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault('counter', 0);
  Meteor.subscribe("chatlog");

  Template.chatting.helpers({
    chatlog: function () {
      if (Session.get("hideChecked")) {
        // If hide checked is checked, filter tasks
        return Chat.find({checked: {$ne: true}}, {sort: {createdAt: -1}});

      } else {
        // Otherwise, return all of the tasks
        return Chat.find({}, {sort: {createdAt: -1}});
      }
    },

    hideChecked: function () {
      return Session.get("hideChecked");
    }
  });

  Template.chatting.events({
    "submit .newchat": function(event) {

      if(Meteor.user().username != "Guest") {
        //Prevent default form submit
        event.preventDefault();

        //Get text from element
        var text = event.target.text.value;

        //Insert a message into the collection
        Meteor.call("addChat", text);

        //Clear element
        event.target.text.value = "";

      } else {
        alert("Sorry only registered users can post.");
      }
    },

    "change .hide-checked input": function (event) {
      Session.set("hideChecked", event.target.checked);
    },

    "click .preview-button": function () {
      var text = event.target.text.value;
      //Other code
    }
  });

  Template.message.events({
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);
    },

    "click .delete": function () {
      Meteor.call("deleteChat", this._id);
    },

    "click .toggle-private": function () {
      Meteor.call("setPrivate", this._id, ! this.private);
    }
  });

  Template.message.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

  Template.hello.helpers({
    counter: function () {
      return Session.get('counter');
    }
  });

  // Runs the Register actions on the register page
  Template.register.events({
    'submit form': function(event) {
      event.preventDefault();
      var username = $('[name=username]').val();
      var email = $('[name=email]').val();
      var password = $('[name=password]').val();
      var repassword = $('[name=password2]').val();

      if(password === repassword) {
        Accounts.createUser({
          username: username,
          email: email,
          password: password
        }, function(error) {
          if(error) {
            console.log(error.reason);
          } else {
            Router.go('home');
            alert("Account has been created!");
          }
        });
      } else {
        alert("The passwords you entered do not match!");
      }
    }
  });

  // Runs the login actions on the login page
  Template.login.events({
    'submit form': function(event) {
      event.preventDefault();
      var email = $('[name=email]').val();
      var password = $('[name=password]').val();
      Meteor.loginWithPassword(email, password, function(error) {
        if(error) {
          console.log(error.reason);
        } else {
          Router.go('home');
          alert("You are now logged in with email " + email + "!");
        }
      });
    },

    'click #guest-login': function(event) {
      Meteor.loginWithPassword('Guest', 'Guest', function(error) {
        if(error) {
          console.log(error.reason);
        } else {
          Router.go('home');
          alert("You are now logged in with restricted privileges as Guest!");
        }
      });
    }
  });

  // Logs the user out when pressing logout button
  Template.navigation.events({
    'click .logout': function(event) {
      event.preventDefault();
      Meteor.logout();
      Router.go('login');
    }
  });

  Template.navItems.helpers({
    activeIfTemplateIs: function(template) {
      var currentRoute = Router.current();
      console.log(template);
      console.log(currentRoute);
      if(currentRoute === null || currentRoute.route === undefined) {
        return 'navbar';
      } else if(template !== currentRoute.lookupTemplate()) {
        return 'navbar';
      }
      return 'navbar active';
    }
  });

  Template.hello.events({
    'click button': function () {
      // increment the counter when button is clicked
      Session.set('counter', Session.get('counter') + 1);
    }
  });
}

Meteor.methods({
  addChat: function (text) {
    //Make sure the user is logged in before adding to chat
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Chat.insert({
      text: text,
      createdAt: new Date(),            //current time
      owner: Meteor.userId(),           //_id of logged in user
      username: Meteor.user().username  //username of logged in user
    });
  },

  deleteChat: function (chatId) {
    var message = Chat.findOne(chatId);
    if (message.private && message.owner !== Meteor.userId()) {
      //if the message is private, make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    }
    Chat.remove(chatId);
  },

  setChecked: function (chatId, setChecked) {
    var message = Chat.findOne(chatId);
    if (message.private && message.owner !== Meteor.userId()) {
      //If the message is private, make sure only the owner can check it off
      throw new Meteor.Error("not-authorized");
    }

    Chat.update(messageId, { $set: { checked: setChecked} });
  },

  setPrivate: function (chatId, setToPrivate) {
    var message = Chat.findOne(chatId);

    //Make sure only the message owner can make a message private
    if (message.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Chat.update(chatId, { $set: { private: setToPrivate} });
  }
});


if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish("chatlog", function () {
    return Chat.find({
      $or: [
        { private: {$ne: true} },
        { owner: this.userId}
      ]
    });
  });

  Meteor.startup(function () {
    // code to run on server at startup
  });
}

Router.route('/', {
  name: 'home',
  template: 'home',
  onAfterAction: function() {
    return setTitle('Home');
  }
});

Router.route('/about', {
  template: 'about',
  onAfterAction: function() {
    return setTitle('About');
  }
});

Router.route('/register', {
  template: 'register',
  name: 'register',
  onAfterAction: function() {
    return setTitle('Register');
  }
});

Router.route('/chatting', {
  template: 'chatting',
  name: 'chatting',
  onAfterAction: function() {
    return setTitle('Chat Room');
  }
});

Router.route('/login', {
  template: 'login',
  name: 'login',
  onAfterAction: function() {
    return setTitle('Login');
  }
});

Router.route('/contactus', {
  template: 'contactus',
  name: 'contactus',
  onAfterAction: function() {
    return setTitle('Contact Us');
  }
});

//Sets the title 'dynamically' on each page
this.setTitle = function(title) {
  if(title) {
    return document.title = title;
  } else {
    return "Kris's Page";
  }
};