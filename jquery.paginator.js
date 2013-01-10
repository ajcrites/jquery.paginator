/**
 * jQuery Pagination plugin
 * When used on an element, this paginates its descendants based on the provided
 * delimiter and provides page navigation based on settings
 */
;(function ($, window, document, undefined) {
   var pluginName = "paginator",
      defaultOptions = {
         //selector for element that delimits paged element components
         delimiter: 'div',
         //at most this many of the delimiter should be on a single page
         perPage: 20,
         //top navigation container element
         topNav: $("<div>").addClass(pluginName + '-container'),
         //bottom navigation container element
         bottomNav: $("<div>").addClass(pluginName + '-container'),
         //template for page number button element
         pageNumNav: $("<span>").addClass(pluginName + '-page-number'),
         //templates for first/last button elements
         showFirstLast: {
            first: $("<span>").addClass(pluginName + '-first-page').text('First'),
            last: $("<span>").addClass(pluginName + '-last-page').text('Last')
         },
         //templates for prev/next button elements
         //These move the displayed page numbers by the provided number of steps
         showPrevNext: {
            prev: $("<span>").addClass(pluginName + '-prev-page').text('<<'),
            next: $("<span>").addClass(pluginName + '-next-page').text('>>'),
            step: 5
         },
         //Maximum number of page numbers to display at a time
         maxNavDisplay: 5,
         //Last initial page number to display.  If false,
         //all page numbers are displayed simultaneously and
         //next/prev are not used
         navDisplay: 1,
         //Initial page number
         changePage: 1
      }
   ;

   Plugin = function ($pages, userOptions) {
      //element that the plugin is bound to
      this.$pages = $pages;
      this.options = $.extend({}, defaultOptions, userOptions);
      var options = this.options;
      //falsy options do not get triggered
      $.each(options, function (property) {
         if (!this) {
            delete options.property;
         }
      });

      this._defaultOptions = defaultOptions;
      this._name = pluginName;

      this.pages = [];
      this.pageIndex = 0;
      /**#@+
       * Create empty selectors that will contain elements created
       * by the plugin for easy access/cleanup
       */
      this.$topNav = $([]);
      this.$bottomNav = $([]);
      this.$pageNumNavTop = $([]);
      this.$pageNumNavBottom = $([]);
      this.$first = $([]);
      this.$last = $([]);
      this.$prev = $([]);
      this.$next = $([]);
      /**#@-*/
   };

   Plugin.prototype = {
      //Initialize the plugin, split up page elements and create navigation
      init: function () {
         var self = this;
         //Loop over each delimiter found as a descendants of the container element
         //Gather all elements between each delimiter (as well as the delimeter's
         //children) and create pages
         this.$pages.find(self.options.delimiter).each(function (index) {
            if (!((index + self.options.perPage) % self.options.perPage)) {
               self.pageIndex++;
            }
            if (!self.pages[self.pageIndex]) {
               self.pages[self.pageIndex] = $([]);
            }
            self.pages[self.pageIndex] = self.pages[self.pageIndex].add($(this).nextUntil(self.options.delimiter).andSelf());
         });

         //skip pagination setup if there is only one page
         if (typeof self.pages[2] === 'undefined') {
            return;
         }
         self.pageIndex = this.options.changePage;

         //Append navigation elements to the DOM
         this.$pages.before(this.options.topNav);
         this.$topNav = this.$topNav.add(this.options.topNav);
         this.$pages.after(this.options.bottomNav);
         this.$bottomNav = this.$bottomNav.add(this.options.bottomNav);

         //Initial navigation setup; this needs to be done in a specific order
         $.each(['pageNumNav', 'showPrevNext', 'showFirstLast', 'navDisplay', 'changePage'], function () {
            if (typeof self['trigger_' + this] === 'function' && self.options[this]) {
               self['trigger_' + this](self.options[this]);
            }
         });
      },

      //Wrapper for the triggering of options based on name; this is done in lieu
      //of a switch statement for the provided options
      trigger: function (options) {
         var self = this;
         $.each(options, function (name, value) {
            if (typeof self['trigger_' + name] === 'function') {
               self['trigger_' + name](value);
            }
         });
      },

      //Create page number navigation bar
      //The argument is a template element from which all of the page numbers
      //elements are cloned
      trigger_pageNumNav: function (base) {
         var self = this;
         for (var x = 1; x < self.pages.length; x++) {
            var $elem = base.clone(true).text(x).on('click', function () {
               self.trigger_changePage($(this).text());
            });

            var $clone = $elem.clone(true);

            self.$topNav.append($elem);
            self.$bottomNav.append($clone);
            self.$pageNumNavTop = self.$pageNumNavTop.add($elem);
            self.$pageNumNavBottom = self.$pageNumNavBottom.add($clone);
         }
      },

      //Create elements for changing the displayed page numbers
      trigger_showPrevNext: function (elements) {
         var self = this;
         if (!self.options.navDisplay) {
            return;
         }

         elements.prev.on('click', function () {
            self.trigger_navDisplay(parseInt(self.$pageNumNavTop.filter(":visible").first().text()) - elements.step);
         });
         elements.next.on('click', function () {
            self.trigger_navDisplay(parseInt(self.$pageNumNavBottom.filter(":visible").last().text()) + elements.step);
         });

         var $prevTop = elements.prev.clone(true);
         var $prevBot = elements.prev.clone(true);
         var $nextTop = elements.next.clone(true);
         var $nextBot = elements.next.clone(true);
         self.$prev = self.$prev.add($prevTop).add($prevBot);
         self.$next = self.$next.add($nextTop).add($nextBot);

         //Prev/Next are only needed if the number of pages exceeds the
         //maximum number of page numbers that can be displayed
         if (self.$pageNumNavTop.length > self.options.maxNavDisplay) {
            self.$pageNumNavTop.first().before($prevTop);
            self.$pageNumNavTop.last().after($nextTop);
         }
         if (self.$pageNumNavBottom.length > self.options.maxNavDisplay) {
            self.$pageNumNavBottom.first().before($prevBot);
            self.$pageNumNavBottom.last().after($nextBot);
         }
      },

      //Append buttons that allow moving to the first and last page
      trigger_showFirstLast: function (elements) {
         var self = this;

         elements.first.on('click', function () {
            self.trigger_changePage(1);
         });
         elements.last.on('click', function () {
            self.trigger_changePage(self.pages.length - 1);
         });

         var $firstTop = elements.first.clone(true);
         var $firstBot = elements.first.clone(true);
         var $lastTop = elements.last.clone(true);
         var $lastBot = elements.last.clone(true);

         self.$first = self.$first.add($firstTop).add($firstBot);
         self.$last = self.$last.add($lastTop).add($lastBot);

         self.$topNav.prepend($firstTop);
         self.$topNav.append($lastTop);

         self.$bottomNav.prepend($firstBot);
         self.$bottomNav.append($lastBot);
      },

      //Change which page numbers are displayed
      //The argument is the number of the last (right-most) page
      //number to be displayed
      trigger_navDisplay: function (lastVisible) {
         firstVisible = lastVisible - this.options.maxNavDisplay;
         //Increase the range so that the last visible is at least
         //equal to the maxNavDisplay; this should also increase
         //firstVisible to 1
         while (lastVisible < this.options.maxNavDisplay) {
            lastVisible++;
            firstVisible++;
         }
         //If lastVisible is greater than the number of pages,
         //reduce it and firstVisible, but do not reduce
         //firstVisible to below 0
         while (lastVisible > this.$pageNumNavTop.length) {
            lastVisible--;
            if (firstVisible > 0) {
               firstVisible--;
            }
         }
         this.$pageNumNavTop.hide();
         this.$pageNumNavTop.slice(firstVisible, lastVisible).show();

         this.$pageNumNavBottom.hide();
         this.$pageNumNavBottom.slice(firstVisible, lastVisible).show();

         //Change display of validity of prev/next
         if (this.$pageNumNavTop.first().is(':visible')) {
            this.$prev.addClass(this._name + '-disabled');
         }
         else {
            this.$prev.removeClass(this._name + '-disabled');
         }

         if (this.$pageNumNavTop.last().is(':visible')) {
            this.$next.addClass(this._name + '-disabled');
         }
         else {
            this.$next.removeClass(this._name + '-disabled');
         }
      },

      //Handle changing page to the provided number
      trigger_changePage: function (pageNum) {
         if (typeof this.pages[pageNum] === 'undefined') {
            return;
         }
         this.pageIndex = pageNum;

         //the hide-all then show some trick will not work because that
         //can screw up the page scrolling
         this.pages[pageNum].show();
         $.each(this.pages, function (index) {
            if (index != pageNum) {
               $(this).hide();
            }
         });

         //Update selected page number
         this.$pageNumNavTop.removeClass(this._name + '-selected');
         this.$pageNumNavTop.eq(pageNum - 1).addClass(this._name + '-selected');
         this.$pageNumNavBottom.removeClass(this._name + '-selected');
         this.$pageNumNavBottom.eq(pageNum - 1).addClass(this._name + '-selected');

         //Update first/last selected
         if (pageNum == 1) {
            this.$first.addClass(this._name + '-disabled');
         }
         else {
            this.$first.removeClass(this._name + '-disabled');
         }

         if (pageNum == this.pages.length - 1) {
            this.$last.addClass(this._name + '-disabled');
         }
         else {
            this.$last.removeClass(this._name + '-disabled');
         }

         //Current page number should be made visible on page change
         this.trigger_navDisplay(pageNum);

         //Trigger an event that allows for additional handling of
         //page change external to the plugin
         this.$pages.trigger(this._name + '.pageChange');
      },

      trigger_destroy: function () {
         $.each(this.pages, function () { $(this).show(); });
         //Remove all elements created by the plugin and appended to the DOM
         this.$topNav.remove();
         this.$bottomNav.remove();
         this.$pageNumNavTop.remove();
         this.$pageNumNavBottom.remove();
         this.$first.remove();
         this.$last.remove();
         this.$prev.remove();
         this.$next.remove();
         $.removeData(this.$pages, this._name)
      }
   };

   $.fn[pluginName] = function (options) {
      return this.each(function () {
         if (!$.data(this, pluginName)) {
            var paginator = new Plugin($(this), options);
            paginator.init();
            $.data(this, pluginName, paginator);
         }
         else {
            $.data(this, pluginName).trigger(options);
         }
      });
   }
})(jQuery, window, document);
