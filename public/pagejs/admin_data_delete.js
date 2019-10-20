// https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
// need to manage the user data in this page

function setProgress(text, value) {
    document.getElementById('progress_text').innerHTML = text;
    updateProgress(value);
}

function updateProgress(value) {
    document.getElementById('progress_display').value = value;
}

function onDeleteCategoriesCheck() {
    // what is this
    var isChecked = !document.getElementById('delete_categories').checked;
    // this will delete items and quantities
    document.getElementById('delete_items').checked = isChecked;
    document.getElementById('delete_quantities').checked = isChecked;
}

function onDeleteItemsCheck() {
    // what is this
    var isChecked = !document.getElementById('delete_items').checked;
    if (document.getElementById('delete_categories').checked) {
        // but categories are to be deleted, can't change this
        document.getElementById('delete_items').checked = false;
    }
    else {
        // this will delete quantities
        document.getElementById('delete_quantities').checked = isChecked;
    }
}

function onDeleteQuantitiesCheck() {
    // what is this
    var isChecked = !document.getElementById('delete_quantities').checked;
    if (document.getElementById('delete_items').checked) {
        // but ites are to be deleted, can't change this
        document.getElementById('delete_quantities').checked = false;
    }
        
}

function deleteAllData() {
    if (confirm('Are you sure, this will clear out everything!')) {
        if (document.getElementById('delete_categories').checked) {
            findAllCategoriesToDelete();
            // which will delete all items and quantities associated
        }
        else if (document.getElementById('delete_items').checked) {
            findAllItemsToDelete();
            // which will delete all items associated
        }
        else if (document.getElementById('delete_quantities').checked) {
            findAllQuantitiesToDelete();
        }
    }
}

var documentIdsToDelete;
var noToDelete;
var noDeleted;

function findAllCategoriesToDelete() {
    // find all the categories we want to delete
    setProgress('finding categories', 0.1);
    firebase.firestore().collection(firebaseData.collectionCategories).get()
        .then(function(querySnapshot) {
            // delete every document we get
            documentIdsToDelete = [];
            querySnapshot.forEach(function(doc) {
                // don't delete from here (promise in a promise), just add to the array of ids to delete
                documentIdsToDelete.push(doc.id);
            });
            noToDelete = documentIdsToDelete.length;
            noDeleted = 0;
            // end of the snapshot, delete all the categories found
            deleteNextCategory();
        });
}

function deleteNextCategory() {
    if (documentIdsToDelete.length > 0) {
        var category = documentIdsToDelete.pop();
        setProgress('deleting category ' + category, ++noDeleted / noToDelete);
        firebase.firestore().collection(firebaseData.collectionCategories).doc(category).delete()
            .then(function() {
                // deleted ok
                deleteNextCategory();
            })
            .catch(function (error) {
                // error
                console.log('failed to delete a category of id ' + category + ': ', error);
                deleteNextCategory();
            });
    }
    else if (document.getElementById('delete_items').checked) {
        findAllItemsToDelete();
    }
    else {
        setProgress('', 0);
    }
}

function findAllItemsToDelete() {
    // find all the Items we want to delete
    setProgress('finding items', 0.1);
    firebase.firestore().collection(firebaseData.collectionItems).get()
        .then(function(querySnapshot) {
            // delete every document we get
            documentIdsToDelete = [];
            querySnapshot.forEach(function(doc) {
                // don't delete from here (promise in a promise), just add to the array of ids to delete
                documentIdsToDelete.push(doc.id);
            });
            noToDelete = documentIdsToDelete.length;
            noDeleted = 0;
            // end of the snapshot, delete all the Items found
            deleteNextItem();
        });
}

function deleteNextItem() {
    if (documentIdsToDelete.length > 0) {
        var item = documentIdsToDelete.pop();
        setProgress('deleting item ' + item, ++noDeleted / noToDelete);
        firebase.firestore().collection(firebaseData.collectionItems).doc(item).delete()
            .then(function() {
                // deleted ok
                deleteNextItem();
            })
            .catch(function (error) {
                // error
                console.log('failed to delete an item of id ' + item + ': ', error);
                deleteNextItem();
            });
    }
    else if (document.getElementById('delete_quantities').checked) {
        findAllQuantitiesToDelete();
    }
    else {
        setProgress('', 0);
    }
}

function findAllQuantitiesToDelete() {
    // find all the quantities we want to delete
    setProgress('finding quantities', 0.1);
    firebase.firestore().collection(firebaseData.collectionQuantities).get()
        .then(function(querySnapshot) {
            // delete every document we get
            documentIdsToDelete = [];
            querySnapshot.forEach(function(doc) {
                // don't delete from here (promise in a promise), just add to the array of ids to delete
                documentIdsToDelete.push(doc.id);
            });
            noToDelete = documentIdsToDelete.length;
            noDeleted = 0;
            // end of the snapshot, delete all the quantities found
            deleteNextQuantity();
        });
}

function deleteNextQuantity() {
    if (documentIdsToDelete.length > 0) {
        var quantity = documentIdsToDelete.pop();
        setProgress('deleting quantity ' + quantity, ++noDeleted / noToDelete);
        firebase.firestore().collection(firebaseData.collectionQuantities).doc(quantity).delete()
            .then(function() {
                // deleted ok
                deleteNextQuantity();
            })
            .catch(function (error) {
                // error
                console.log('failed to delete an quantity of id ' + quantity + ': ', error);
                deleteNextQuantity();
            });
    }
    else {
        setProgress('', 0);
    }
}

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
});