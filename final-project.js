Router.configure({
  notFoundTemplate: '404error',
  layoutTemplate: 'main'
  //loadingTemplate: 'loading'
});

Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault('counter', 0);
  Meteor.subscribe("tasks");

  Template.home.helpers({
    tasks: function() {
      if(Session.get("hideCompleted")) {
        // If hide completed is checked, filter tasks
        return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
      } else {
        // Otherwise, return all of the tasks
        return Tasks.find({}, {sort: {createdAt: -1}});
      }
      //Show newest tasks at the top
      //return Tasks.find({}, {sort: {createdAt: -1}});

      //return Tasks.find();
    },

    hideCompleted: function () {
      return Session.get("hideCompleted");
    },

    incompleteCount: function () {
      return Tasks.find({checked: {$ne: true}}).count();
    }
  });

  Template.home.events({
    "submit .new-task": function(event) {
      //Prevent default browser form submit
      event.preventDefault();

      //Get value from form element
      var text = event.target.text.value;

      //Insert a task into the collection
      Meteor.call("addTask", text);

      //Tasks.insert({
      //  text: text,
      //  createdAt: new Date(),            //current time
      //  owner: Meteor.userId(),           //_id of logged in user
      //  username: Meteor.user().username  //username of logged in user
      //});

      //Clear form
      event.target.text.value = "";
    },

    "change .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
    }
  });

//  Template.body.helpers({
//    tasks: [
//      { text: "This is task 1" },
//      { text: "This is task 2" },
//      { text: "This is task 3" }
//    ]
//  });

  Template.task.events({
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);
      //Tasks.update(this._id, {
      //  $set: {checked: ! this.checked}
      //});
    },

    "click .delete": function () {
      Meteor.call("deleteTask", this._id);
      //Tasks.remove(this._id);
    },

    "click .toggle-private": function () {
      Meteor.call("setPrivate", this._id, ! this.private);
    }
  });

  Template.task.helpers({
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

  Template.register.events({
    'submit form': function() {
      event.preventDefault();
      var email = $('[name=email]').val();
      var password = $('[name=password]').val();
      Accounts.createUser({
        email: email,
        password: password
      }, function(error) {
          if(error) {
            console.log(error.reason);
          } else {
            Router.go('about');
          }
      });
      Router.go('about');
    }
  });

  Template.login.events({
    'submit form': function(event) {
      event.preventDefault();
      var email = $('[name=email]').val();
      var password = $('[name=password]').val();
      Meteor.loginWithPassword(email, password, function() {
        if(error) {
          console.log(error.reason);
        } else {
          Router.go('about');
        }
      });
    }
  });

  Template.navigation.events({
    'click .logout': function(events) {
      event.preventDefault();
      Meteor.logout();
      Router.go('login');
    }
  });

  Template.navItems.helpers({
    activeIfTemplateIs: function(template) {
      var currentRoute = Router.current();
      if(currentRoute === null || template !== currentRoute.lookupTemplate()) {
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
  addTask: function (text) {
    //Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.insert({
      text: text,
      createdAt: new Date(),            //current time
      owner: Meteor.userId(),           //_id of logged in user
      username: Meteor.user().username  //username of logged in user
    });
  },

  deleteTask: function (taskId) {
    var task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      //if the task is private, make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    }

    Tasks.remove(taskId);
  },

  setChecked: function (taskId, setChecked) {
    var task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      //If the task is private, make sure only the owner can check it off
      throw new Meteor.Error("not-authorized");
    }

    Tasks.update(taskId, { $set: { checked: setChecked} });
  },

  setPrivate: function (taskId, setToPrivate) {
    var task = Tasks.findOne(taskId);

    //Make sure only the task owner can make a task private
    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.update(taskId, { $set: { private: setToPrivate} });
  }
});


if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish("tasks", function () {
    return Tasks.find({
      $or: [
        { private: {$ne: true} },
        { owner: this.userId}
      ]
    });
    //return Tasks.find();
  });

  Meteor.startup(function () {
    // code to run on server at startup
  });
}

Router.route('/', {
  name: 'home',
  template: 'home'
});

Router.route('/about', {
  template: 'about'
});

Router.route('/register', {
  template: 'register',
  name: 'register'
});

Router.route('/login', {
  template: 'login',
  name: 'login'
});

Router.route('/contactus', {
  template: 'contactus',
  name: 'contactus'
});