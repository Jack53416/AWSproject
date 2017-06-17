
exports.showError = function showError(err, callback) {
    return callback(null, {template: "notification.ejs", params: {suc: '', err: err}});

};

exports.showSuccess = function showSuccess(suc, callback) {
    return callback(null, {template: "notification.ejs", params: {suc: suc, err: ''}});
};