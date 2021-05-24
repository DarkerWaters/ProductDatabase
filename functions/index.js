// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
const fieldValue = require('firebase-admin').firestore.FieldValue;

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

// and get the firestore database to write / read data etc
const db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// when a user is created / first sign on, then we want to create the user entry to track their subscriptions etc
exports.createUserData = functions.auth.user().onCreate((user) => {

    var lcRef = function (str) {
        if (!str) {
            return str;
        }
        else {
            // remove all spaces and make it lowercase
            str = str.toLowerCase().replace(/\s/g,'');
            if (str.length > 1 && str.slice(-1) === 's') {
                // remove any trailing 's' characters
                str = str.slice(0, -1);
            }
            return str;
        }
    };

    // create the skeleton of user data
    var newUserData = {
        // setup the blank user data here
        name: user.displayName,
        name_lc: lcRef(user.displayName),
        email: user.email,
        email_lc: lcRef(user.email),
        isAdmin: false,
        isReader: false,
        isTracked: true,
        company: "",
        company_lc: "",
        phone: "",
        trade: "",
        trade_no: "",
        isRequestPending: false,
    };
    db.collection('users').doc(user.uid).set(newUserData, {merge: true})
        .then(function() {
            // this worked
            console.log('added user data', user);
            return 0;
        })
        .catch(function(error) {
            // failed
            console.log("failed to create the user data", error);
        });
    return 0;
});

// when a user is deleted, they are leaving, then we want to say goodbye and also to delete all their stored user data
exports.deleteUserData = functions.auth.user().onDelete((user) => {
    // delete all their data, to comply with GDPR
    
    // lastly - delete their user data
    db.collection('users').doc(user.uid).delete()
        .then(function() {
            // this worked
            console.log('deleted user data', user);
            return 0;
        })
        .catch(function(error) {
            // this didn't work
            console.log('failed to delete a the user data', error);
        });

    // and return
    return 1;
});

// when a user's data is changed, assign the proper role (admin, based on the 'isAdmin' flag in the data)
exports.updateAdminRole = functions.firestore
    .document('users/{userId}')
    .onUpdate((change, context) => {
        var data = change.after.data();
        var result = 0;
        if (data.isAdmin !== change.before.data().isAdmin) {
            // there was a change to the 'isAdmin' value
            if (data.isAdmin) {
                // changed to admin user, update the role for this user
                admin.auth().setCustomUserClaims(context.params.userId, {admin: true});
                result = 1;          
            }
            else {
                // change to not be admin user, remove this role from the user
                admin.auth().setCustomUserClaims(context.params.userId, {admin: false});
                result = 2;
            }
        }
        // return the result of this (0 if done nothing)
        return result;
    });

/**
 * Listen for changes in all documents in the 'item_categories' collection
 */
 exports.processCategoryChange = functions.firestore
    .document('item_categories/{categoryId}')
    .onUpdate((change, context) => {
        // this is a write of data
        const after = change.after.data();
        const before = change.before.data();
        if (before && after && after.name !== before.name) {
            // this is a change in our name, so update all who reference this category
            const newData = { 'category_name' : after.name };
            admin.firestore().collection('items')
                .where('category_ref', '==', change.ref)
                .get()
                .then((querySnapshot) => {
                    // have all the items that reference this category - change the name specified
                    if (querySnapshot) {
                        // so delete them all please...
                        querySnapshot.forEach((doc) => {
                            doc.ref
                                .set(newData, {merge: true})
                                .then()
                                .catch((error) => {
                                    console.error('Failed to update the item with the new category name', error);
                                });
                        });
                    }
                    return 1;
                })
                .catch((error) => {
                    console.error('Failed to find the item from the target cat of ' + change.ref, error);
                    return -1;
                });
            // and update the quantities
            admin.firestore().collection('quantities')
                .where('category_ref', '==', change.ref)
                .get()
                .then((querySnapshot) => {
                    // have all the quantities that reference this category - change the name specified
                    if (querySnapshot) {
                        // so delete them all please...
                        querySnapshot.forEach((doc) => {
                            doc.ref
                                .set(newData, {merge: true})
                                .then()
                                .catch((error) => {
                                    console.error('Failed to update the quantity with the new category name', error);
                                });
                        });
                    }
                    return 1;
                })
                .catch((error) => {
                    console.error('Failed to find the quantity from the target cat of ' + change.ref, error);
                    return -1;
                });
        }
        // just return
        return false;
    });

/**
 * Listen for changes in all documents in the 'items' collection
 */
 exports.processItemChange = functions.firestore
    .document('items/{itemId}')
    .onUpdate((change, context) => {
        // this is a write of data
        const after = change.after.data();
        const before = change.before.data();
        if (before && after && 
            (after.name !== before.name || after.quality !== before.quality)) {
            // this is a change in our name, so update all who reference this item
            const newData = { 'item_name' : after.name, 'item_quality' : after.quality };
            // and update the quantities
            admin.firestore().collection('quantities')
                .where('item_ref', '==', change.ref)
                .get()
                .then((querySnapshot) => {
                    // have all the quantities that reference this item - change the name specified
                    if (querySnapshot) {
                        // so delete them all please...
                        querySnapshot.forEach((doc) => {
                            doc.ref
                                .set(newData, {merge: true})
                                .then()
                                .catch((error) => {
                                    console.error('Failed to update the quantity with the new item name', error);
                                });
                        });
                    }
                    return 1;
                })
                .catch((error) => {
                    console.error('Failed to find the quantity from the target item of ' + change.ref, error);
                    return -1;
                });
        }
        // just return
        return false;
    });
