// JQuery extensions for the console
jQuery.fn.exists = function() {
    return (this.length !== 0);
};
jQuery.extend(jQuery.expr[':'], {
  focus: function() { return this == document.activeElement; }
});