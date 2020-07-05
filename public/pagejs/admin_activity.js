// https://firebase.google.com/docs/auth/web/manage-activity#get_the_currently_signed-in_activity
// need to manage the activity data in this page

function splitId(elementToSplit) {
    var idString = elementToSplit.id;
    var index = idString.lastIndexOf('_');
    return [idString.substring(0, index), idString.substring(index + 1, idString.length)];
}

function searchUserNames() {
    var container = document.getElementById('found_activity_container');
    var name = document.getElementById('name').value;
    container.innerHTML = "Searching for users with the name of '" + name + "'.";

    firebase.firestore()
        .collection(firebaseData.collectionActivity)
        .orderBy("at", "desc")
        .where("by_name_lc", "==", firebaseData.lcRef(name)).get()
        .then(function(querySnapshot) {
            // this worked
            if (querySnapshot.empty) {
                container.innerHTML = "Sorry: failed to find any users with the name of '" + name + "'.";
            }
            else {
                container.innerHTML = "";
            }
            querySnapshot.forEach(function (doc) {
                // for each user, add the user to the container
                displayActivityData(container, doc);
            });
            return 1;
        })
        .catch(function(error) {
            // this didn't work
            console.log("Failed to get the log collection to show activity: ", error);
        });
}

function searchUserEmails() {
    var container = document.getElementById('found_activity_container');
    var email = document.getElementById('email').value;
    container.innerHTML = "Searching for users with the email address of '" + email + "'.";

    firebase.firestore()
        .collection(firebaseData.collectionActivity)
        .orderBy("at", "desc")
        .where("by_email_lc", "==", firebaseData.lcRef(email)).get()
        .then(function(querySnapshot) {
            // this worked
            if (querySnapshot.empty) {
                container.innerHTML = "Sorry: failed to find any users with the email address of '" + email + "'.";
            }
            else {
                container.innerHTML = "";
            }
            querySnapshot.forEach(function (doc) {
                // for each user, add the user to the container
                displayActivityData(container, doc);
            });
            return 1;
        })
        .catch(function(error) {
            // this didn't work
            container.innerHTML = "Sorry: failed to find any users with the email address of '" + email + "': " + error;
            return 0;
        });
}

var lastVisible = null;
function getAllActivity() {
    var container = document.getElementById('found_activity_container');
    container.innerHTML = "Searching for all activity (in batches of 50).";
    // get all the activity and add them to the list
    firebaseData.getGlobalTrackingData(lastVisible, 50, 
        function(querySnapshot) {
            if (!querySnapshot.empty) {
                lastVisible = querySnapshot.docs[querySnapshot.docs.length-1];
                if (lastVisible) {
                    // the search button will do the next batch next time
                    document.getElementById('search_all_button').innerHTML = "next 50";
                }
                else {
                    lastVisible = null;
                    document.getElementById('search_all_button').innerHTML = "List all activity";
                }
            }
            else {
                lastVisible = null;
                document.getElementById('search_all_button').innerHTML = "List all activity";
            }
            // have the data, go through it all
            querySnapshot.forEach(function (doc) {
                // for each activity, add the activity to the container
                displayActivityData(container, doc);
            });
        });
}

function displayActivityData(container, doc) {
    var activityDiv = document.getElementById('activity_template').cloneNode(true);
    container.appendChild(activityDiv);
    // set the id of this
    activityDiv.id = doc.id;
    // and get the children we want to use
    var dateEdit = activityDiv.querySelector('#activity_date');
    var typeEdit = activityDiv.querySelector('#activity_type');
    var nameEdit = activityDiv.querySelector('#activity_name');
    var emailEdit = activityDiv.querySelector('#activity_email');
    var companyEdit = activityDiv.querySelector('#activity_company');

    var catEdit = activityDiv.querySelector('#activity_category');
    var itemEdit = activityDiv.querySelector('#activity_item');
    var qualityEdit = activityDiv.querySelector('#activity_quality');
    
    // to avoid duplicates, we want our own IDs here
    dateEdit.id = doc.id + '_' + dateEdit.id;
    typeEdit.id = doc.id + '_' + typeEdit.id;
    nameEdit.id = doc.id + '_' + nameEdit.id;
    emailEdit.id = doc.id + '_' + emailEdit.id;
    companyEdit.id = doc.id + '_' + companyEdit.id;
    catEdit.id = doc.id + '_' + catEdit.id;
    itemEdit.id = doc.id + '_' + itemEdit.id;
    qualityEdit.id = doc.id + '_' + qualityEdit.id;

    // get the data and populate the fields
    var data = doc.data();
    dateEdit.innerHTML = data.at ? data.at.toDate().toLocaleString() : "none";
    typeEdit.innerHTML = data.action;
    nameEdit.innerHTML = data.by_name;
    emailEdit.innerHTML = data.by_email;
    companyEdit.innerHTML = data.by_company;
    catEdit.innerHTML = data.category_name;
    itemEdit.innerHTML = data.item_name;
    qualityEdit.innerHTML = data.item_quality;
}

document.addEventListener('firebaseactivitychange', function() {
    console.log('login changed so ready for input');
});