(function() {

L.Control.Form = L.Control.extend({
    includes: L.Mixin.Events,

    eventType: {
        show: 'form:show',
        submit: 'form:submit',
        hide: 'form:hide'
    },

    options: {
        id: '',
        url: '',
        method: 'GET',
        firstInput: '',
        regexp: undefined,
        successMessage: '',
        errorMessage: '',
        initData: undefined
    },

    initialize: function (options) {
        L.Util.setOptions(this, options || {});
        var self = this;
        self.options.eid = '#' + self.options.id;
        self.options.data = {};
        self.listeners = {};
        // disable map click/drag event propagation
        L.DomEvent.disableClickPropagation(L.DomUtil.get(self.options.id));
        // close the popup when close button is clicked
        $(self.options.eid + ' > .btn-close-popup').click(function() {
            $(self.options.eid).hide();
            self._fireEvent(self.eventType.hide);
        });
        // do submit when submit button is clicked
        $(self.options.eid + ' > button').click(function() {
            self.submit();
        });
        // centering the popup window
        $(window).resize(function() {
            $(self.options.eid).center();
        });
        $(self.options.eid).center();
        // implement regular expression validator for each input
        $(self.options.eid + ' > input').keyup(function(e) {
            $(e.target).removeClass();
            var val = $(e.target).val();
            var name = $(e.target).attr('name');
            var regexp = (self.options.regexp ? self.options.regexp[name] : undefined);
            self.options.data[name] = val;  // save the value
            if (val.length > 0) {
                if (regexp) {
                    if ((typeof regexp === 'object' && regexp.test(val)) ||
                            (typeof regexp === 'function' && regexp.length >= 1 && regexp(val))) {
                        $(e.target).addClass('valid');
                    } else {
                        $(e.target).addClass('invalid');
                    }
                }
            } else if (regexp) {
                $(e.target).addClass('invalid');
            }
        });
        // activate mutex when the popup is shown
        self.on(self.eventType.show, function() { self.options.mutex.active = self; });
        // deactivate mutex when the popup is hidden
        self.on(self.eventType.hide, function() { self.options.mutex.active = undefined; });
    },

    hide: function () {
        $(this.options.eid).hide();
        this._fireEvent(this.eventType.hide);
    },

    show: function () {
        if (this.options.mutex && this.options.mutex.active) {
            this.options.mutex.active.hide();
        }

        $(this.options.eid + " > input").val("");
        $(this.options.eid + " > input").removeClass();
        for (var name in this.options.initData) {
            $(this.options.eid + " > input[name='" + name + "']").val(this.options.initData[name]);
        }
        $(this.options.eid).show();
        if (this.options.firstInput) {
            $(this.options.eid + " > input[name='" + this.options.firstInput + "']").focus();
        }
        // invoke the listeners of event 'form:show
        this._fireEvent(this.eventType.show);
    },

    _fireEvent: function (type, data) {
        var self = this;
        if (this.listeners[type]) {
            this.listeners[type].forEach(function(callback) {
                if (callback.length == 0) {
                    callback();
                } else {
                    callback({
                        type: type,
                        target: self,
                        data: data
                    });
                }
            });
        }
    },

    submit: function () {
        var self = this,
            regexp,
            val;

        // populate & validate data
        $(self.options.eid + ' > input').keyup();
        for (var name in this.options.data) {
            if (!this.options.regexp) {
                break;
            }
            regexp = this.options.regexp[name];
            val = this.options.data[name];
            if ((typeof regexp === 'object' && !regexp.test(val)) ||
                    (typeof regexp === 'function' && regexp.length >= 1 && !regexp(val))) {
                return;
            }
        }

        $.ajax({
            url: this.options.url,
            type: this.options.method,
            data: this.options.data,
            success: function() {
                if (self.options.successMessage) {
                    alert(self.options.successMessage);
                }
                self._fireEvent(self.eventType.submit);
                $(self.options.eid).hide();
                self._fireEvent(self.eventType.hide);
            }
        }).fail(function() {
            if (self.errorMessage) {
                alert(self.errorMessage);
            } else {
                alert("Error.");
            }
        });
    },

    on: function (eventType, callback) {
        if (this.listeners[eventType]) {
            this.listeners[eventType].push(callback);
        } else {
            this.listeners[eventType] = [callback];
        }
        return this;
    }
});

L.control.form = function (options) {
	return new L.Control.form(options);
};


}).call(this);
