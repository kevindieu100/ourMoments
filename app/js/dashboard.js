//init firebase
var config = {
apiKey: "AIzaSyBtqKztey7_gttkMRQ1A7COfy9_XmtAKhk",
authDomain: "ourmoments-b6dd4.firebaseapp.com",
databaseURL: "https://ourmoments-b6dd4.firebaseio.com",
storageBucket: "ourmoments-b6dd4.appspot.com",
messagingSenderId: "251514973619"
};
firebase.initializeApp(config);

//displays the alert popUp
function displayAlert(message){
    $("#popUpAlert").html(message);
    $("#popUpAlert").dialog({
        resizable: false,
        draggable: false,
        hide: 'fade',
        show: 'fade',
        width: 350,
        height: 100,
        modal: true
    });
}

function CloseFunction(event, ui){
    loggedIn();
    chrome.storage.local.get(['userName','significantOther', 'noteSize'], function(obj){
        var user = obj.userName;
        var size = obj.noteSize;
        var sigOther = obj.significantOther;
        var pathToDataBase = "/users/"+user+"/"+"notes";
        var path = "/users/"+user;
        var pathToSigDataBase= "/users/"+sigOther;
        var newSize = size - 1;
        var pathToImage = user + '/images/' + size +'.jpg';
        if(size != 0){
            //gets the reference for firebase (supposed to retrieve the array of note types)
            var ref = firebase.database().ref(pathToDataBase);
            ref.once('value').then(function(snapshot) {
                console.log("size: "+ size);
                console.log(snapshot.val());
              var arr = snapshot.val();
              var noteType = arr[size-1].noteType;
              var message = arr[size-1].message;
              var imageId = arr[size-1].ImageId;
              var imageExists = arr[size-1].imageExists
              
              ref.child(newSize).remove(); //removes the recently viewed note
              decrementNoteSize(size, path, pathToSigDataBase, user);
              if(imageExists){
                var storageRef = firebase.storage().ref();
                storageRef.child(pathToImage).delete(); //deletes the image after seeing it
              }
            });
        }
    });
}

//actually displays the moment popUp
function displayPopUpMoment(noteType, message, pathToImage, imageExists){
    var titleName = "";
    if(noteType == "rememberWhen")
        titleName = "Remember when...";
    else if(noteType == "iLoveYouBecause")
        titleName = "I love you because..."
    else if(noteType == "iJustWantYouToKnow")
        titleName = "I just want you to know that..."
    else
        titleName = "Random derp ...";
    if(imageExists){
        var storageRef = firebase.storage().ref();
        storageRef.child(pathToImage).getDownloadURL().then(function(url){
            console.log(url);
            $("#momentImage").attr("src", url);
            $("#momentImage").show();
            $("#momentImageContainer").show();
        });
        $("#momentMessage").html(message);
        $("#popUpMoment").dialog({
            resizable: false,
            draggable: false,
            hide: 'fade',
            show: 'fade',
            width: 500,
            height: 500,
            modal: true,
            close: function(event, ui){
                CloseFunction();
            },
            title: titleName
        });
    }else{
        $("#momentImageContainer").hide();
        $("#momentImage").hide();
        $("#momentMessage").html(message);
        $("#popUpMoment").dialog({
            resizable: false,
            draggable: false,
            hide: 'fade',
            show: 'fade',
            width: 500,
            height: 230,
            modal: true,
            close: function(event, ui){
                CloseFunction();
            },
            title: titleName
        });
    }
}

//displays the Moment popUp
function displayMoment(){
    loggedIn();
    chrome.storage.local.get(['userName','significantOther', 'noteSize'], function(obj){
        var user = obj.userName;
        var size = obj.noteSize;
        var sigOther = obj.significantOther;
        var pathToDataBase = "/users/"+user+"/"+"notes";
        var path = "/users/"+user;
        var pathToSigDataBase= "/users/"+sigOther;
        var newSize = size - 1;
        var pathToImage = user + '/images/' + size +'.jpg';
        if(size == 0){
            displayAlert("Sorry, no more notes )-:");
        }else{
            //gets the reference for firebase (supposed to retrieve the array of note types)
            var ref = firebase.database().ref(pathToDataBase);
            ref.once('value').then(function(snapshot) {
                console.log("size: "+ size);
                console.log(snapshot.val());
              var arr = snapshot.val();
              var noteType = arr[size-1].noteType;
              var message = arr[size-1].message;
              var imageId = arr[size-1].ImageId;
              var imageExists = arr[size-1].imageExists
              displayPopUpMoment(noteType, message, pathToImage, imageExists);
            });
            //ref.child(newSize).remove();
        }

    });

}

function initListeners(){
    //listeners for enter event
    $(document).keyup(function (e) {
        if ($("#userNameInput:focus") && (e.keyCode === 13)) {
            saveUserNameToChromeStorage();
        }
    });

    //displays the survey
    $("#memoryButton").click(function() {
        console.log("clicked");
        $("#popUpForm").dialog({
            resizable: false,
            draggable: false,
            hide: 'fade',
            show: 'fade',
            width: 570,
            height: 500,
            modal: true
        });
    });

    //displays the memory pop up
    $('#heartButton').click(function(){
        console.log("heart button clicked!");
        displayMoment();
    });



    $("#addNoteForm").submit(function(e) {
        e.preventDefault();
        console.log("submit note attempted");
        submitNote();
    });
}

function decrementNoteSize(size, pathToDataBase, pathToSigDataBase){
    console.log("pathToDataBase: "+ pathToDataBase);
    console.log("pathToSigDataBase: "+ pathToSigDataBase);
    console.log("size: "+size);
    var noteSize = size-1;
    var updates = {};
    updates[pathToDataBase + '/noteSize'] = noteSize;
    firebase.database().ref().update(updates);
    chrome.storage.local.set({'noteSize': noteSize});

    var updates2 = {};
    updates2[pathToSigDataBase + '/sigNoteSize'] = noteSize;
    firebase.database().ref().update(updates2);
}

function incrementSigNoteSize(size, pathToDataBase, pathToMyDataBase){
    noteSize = size+ 1; //increments the noteSize
    var updates = {};
    updates[pathToDataBase + '/noteSize'] = noteSize;
    firebase.database().ref().update(updates);
    chrome.storage.local.set({'sigNoteSize': noteSize});

    var updates2 = {};
    updates2[pathToMyDataBase+'/sigNoteSize'] = noteSize;
    firebase.database().ref().update(updates2);
}

//only reaches this if username is stored locally
function submitNoteToFirebase(){
    chrome.storage.local.get(['userName','significantOther', 'noteSize', 'sigNoteSize'], function(obj){
        var name = obj.userName;
        var sigOther = obj.significantOther;
        //var noteSize = updateNoteSizeLocally(name);
        var noteSize = obj.noteSize;
        var sigNoteSize = obj.sigNoteSize;
        var noteType = $( "#noteType option:selected").val();
        var message = $("#message").val();
        var pathToDataBase = '/users/' + sigOther;
        var pathToMyDataBase = '/users/' + name;
        var file = document.querySelector('input[type=file]').files[0];
        var reader  = new FileReader();
        var ref = firebase.database().ref(pathToDataBase);
        var newChildRef = ref.child("notes");

        if( message == null || message =='' || noteType == null || noteType == ''){
            displayAlert("Error: empty form field!");
        }
        else{
            var imageExists = false;
            if(file)
                imageExists = true;
            newChildRef.child(sigNoteSize).set({
                "noteType": noteType,
                "message" : message,
                "ImageId": sigNoteSize,
                "imageExists" : imageExists
            });
            incrementSigNoteSize(sigNoteSize, pathToDataBase, pathToMyDataBase);

            //adds image to database
            if(file){
                var newSize = sigNoteSize + 1;
                reader.readAsDataURL(file);
                var imagePath = sigOther + '/images/' + newSize +'.jpg';
                console.log(imagePath);
                var storageRef = firebase.storage().ref();
                var imagesRef = storageRef.child(imagePath);
                imagesRef.put(file);
            }
        }

        $("#message").val("");
        var file = document.getElementById("fileButton");
        file.value = file.defaultValue;
    });
}

function submitNote(){
    chrome.storage.local.get('signedIn', function(obj){
        if(obj.signedIn){ //only uploads if userName is set
            submitNoteToFirebase();
        }else{
            displayAlert("Sorry, you are not logged in.");
        }
    });

    $("#popUpForm").dialog("close");
}

function saveUserNameToChromeStorage(){
    // Get a value saved in a form.
    var name = $("#userNameInput")[0].value;
    var signedIn = true;
    // Check that there's some code there.
    if (name == null || name=='') {
      displayAlert('Error: No value specified');
      signedIn = false;
      chrome.storage.local.set({'signedIn': false});
      chrome.storage.local.set({'userName': ''});
      chrome.storage.local.set({'significantOther': ''});
      chrome.storage.local.set({'noteSize': null});
      chrome.storage.local.set({'sigNoteSize': null});
      return;
    }else{
        // Save it using the Chrome extension storage API.
        chrome.storage.local.set({'userName': name}, function() {
            console.log("user created");
        });

        chrome.storage.local.set({'signedIn': signedIn});

        //saves significant other locally
        firebase.database().ref('/users/' + name).once('value').then(function(snapshot) {
          var sigOther = snapshot.val().significantOther;
          var noteSize = snapshot.val().noteSize;
          console.log(sigOther);
          console.log("signed in noteSize:" + noteSize);
          chrome.storage.local.set({'significantOther': sigOther});
          chrome.storage.local.set({'noteSize': noteSize});

          firebase.database().ref('/users/'+sigOther).once('value').then(function(s){
            console.log("significant other note size: "+ s.val().noteSize);
            chrome.storage.local.set({'sigNoteSize': s.val().noteSize})
          });
        });
        loggedIn();
    }
}

function loggedIn(){
    chrome.storage.local.get('signedIn', function(obj){
        if(obj.signedIn){
            //$('#userNameInput')[0].remove();
            chrome.storage.local.get('userName', function(obj){
                console.log(obj.userName);
                var fb = firebase.database();
                fb.ref('/users/'+ obj.userName).once('value').then(function(snapshot){
                    user = snapshot.val();
                    $('#userNameInput').hide();
                    $("#beb").html(user.name + ".");
                    //$('#userNameInput').val(user.name);
                    chrome.storage.local.set({'userName': user.userName});
                    chrome.storage.local.set({'significantOther': user.significantOther});
                    chrome.storage.local.set({'noteSize': user.noteSize});
                    chrome.storage.local.set({'sigNoteSize': user.sigNoteSize});
                });
            });
            //$('#beb').html("Beb.");
        }
    });
}

//creation of all the UI stuff
$(document).ready(function() {
	determineBackground();
	determineCurrentDateAndLetterWeek();
	startClock();
	startAnniversary();
    loggedIn();
    initListeners();
});

function determineCurrentDateAndLetterWeek(){
	//determines the current date & weather
	var todaysDate = new Date();
    var dd = todaysDate.getDate();
    var mm = todaysDate.getMonth()+1; //January is 0!
    var yyyy = todaysDate.getFullYear();

    if(dd<10) {
        dd='0'+dd
    } 

    if(mm<10) {
        mm='0'+mm
    } 
	$('#currentDate').html(mm + " / "+ dd+ " / "+ yyyy);


    var startLetters = new Date(2016, 8, 9, 0, 0, 0);
    seconds = Math.floor((todaysDate - (startLetters))/1000);
    minutes = Math.floor(seconds/60);
    hours = Math.floor(minutes/60);
    days = Math.floor(hours/24);
    
    hours = hours-(days*24);
    minutes = minutes-(days*24*60)-(hours*60);
    seconds = seconds-(days*24*60*60)-(hours*60*60)-(minutes*60);

    days += 39;
    var week = Math.floor(days/7);
    $('#letterWeek').html("Week "+ week +" of ");
}

function startAnniversary(){
    var date_future = new Date();
    var date_now = new Date(2014, 10, 17, 16, 32, 17, 17);

    var seconds = Math.floor((date_future - (date_now))/1000);
    var minutes = Math.floor(seconds/60);
    var hours = Math.floor(minutes/60);
    var days = Math.floor(hours/24);
    
    var hours = hours-(days*24);
    var minutes = minutes-(days*24*60)-(hours*60);
    var seconds = seconds-(days*24*60*60)-(hours*60*60)-(minutes*60);

    days+=32;

    //adds them to the dom
    $('#anniDays').html(days + " days");
    $('#anniHours').html(hours + " hours");
    $('#anniMinutes').html(minutes + " minutes");
    $('#anniSeconds').html(seconds + " seconds.");

	setTimeout(startAnniversary, 1000);
}//end of startAnniversary

function determineBackground(){
	var date = moment().format('DD');
	console.log(date);
	var imagePath = "linear-gradient( rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.25)), url('img/" + date +".jpg')";
	document.body.style.backgroundImage = imagePath;

	$('#center').css({
        'position' : 'absolute',
        'left' : '50%',
        'top' : '50%',
        'margin-left' : -$('#center').outerWidth()/2,
        'margin-top' : -$('#center').outerHeight()/2
    });
}//end of determineBackground

function startClock(){
    var time = moment().format('h:mm');
    $('#currentTime').html(time);
    setTimeout(startClock, 1000);
}//end of startClock()