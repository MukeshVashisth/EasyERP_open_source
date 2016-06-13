define([
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/salesQuotations/list/ListHeader.html',
    'text!templates/salesOrders/list/ListHeader.html',
    'text!templates/stages.html',
    'views/salesQuotations/CreateView',
    'views/salesOrders/list/ListItemView',
    'views/supplierPayments/list/ListTotalView',
    'views/salesOrders/EditView',
    'models/QuotationModel',
    'collections/salesQuotations/filterCollection',
    'dataService',
    'constants',
    'helpers',
    'helpers'
], function ($,
             _,
             ListViewBase,
             listTemplate,
             listForWTrack,
             stagesTemplate,
             CreateView,
             ListItemView,
             ListTotalView,
             EditView,
             QuotationModel,
             ContentCollection,
             dataService,
             CONSTANTS,
             helpers) {
    'use strict';

    var OrdersListView = ListViewBase.extend({

        listTemplate     : listTemplate,
        ListItemView     : ListItemView,
        ContentCollection: ContentCollection,
        CreateView       : CreateView,
        EditView         : EditView,

        viewType   : 'list',
        contentType: CONSTANTS.SALESORDERS, // needs in view.prototype.changeLocationHash

        events: {
            'click  .list tbody td:not(.notForm)': 'goToEditDialog'
        },

        initialize: function (options) {
            this.filter = options.filter || {};
            this.filter.forSales = {
                key  : 'forSales',
                value: ['true']
            };

            this.startTime = options.startTime;
            this.collection = options.collection;
            this.parrentContentId = options.collection.parrentContentId;
            this.sort = options.sort;
            this.page = options.collection.currentPage;

            this.render();
        },

        chooseOption: function (e) {
            var self = this;
            var $target = $(e.target);
            var $targetElement = $target.parents('td');
            var id = $targetElement.attr('id');
            var model = this.collection.get(id);

            model.save({
                workflow: $target.attr('id')
            }, {
                patch   : true,
                validate: false,
                success : function () {
                    self.showFilteredPage(self.filter, self);
                }
            });

            this.hideNewSelect();
            return false;
        },

        recalcTotal: function () {
            var $thisEl = this.$el;
            var $total = $thisEl.find('#total');
            var total = 0;

            _.each(this.collection.toJSON(), function (model) {
                var modelCurrency = model.currency;

                if (modelCurrency && modelCurrency.rate) {
                    total += parseFloat(model.paymentInfo.total / modelCurrency.rate);
                } else {
                    total += parseFloat(model.paymentInfo.total);
                }
            });

            total = helpers.currencySplitter(total.toFixed(2));
            $total.text(total);
        },

        render: function () {
            var $thisEl = this.$el;
            var itemView;

            $('.ui-dialog ').remove();

            $thisEl.html('');
            $thisEl.append(_.template(listForWTrack));

            itemView = new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            });

            $thisEl.append(itemView.render());

            $thisEl.append(new ListTotalView({
                element : this.$el.find('#listTable'),
                cellSpan: 5
            }).render());

            this.renderFilter();
            this.renderPagination($thisEl, this);
            this.recalcTotal();
            
            $thisEl.append('<div id="timeRecivingDataFromServer">Created in ' + (new Date() - this.startTime) + ' ms</div>');
        },

        goToEditDialog: function (event) {
            var self = this;
            var $eventTarget = $(event.target);
            var $closestTr = $eventTarget.closest('tr');
            var dataId = $closestTr.data('id');
            var isNotEditable = $closestTr.hasClass('notEditable');
            var quotationModel = new QuotationModel({
                validate: false
            });
            var onlyView;

            event.preventDefault();

            if (isNotEditable) {
                onlyView = true;
            }

            quotationModel.urlRoot = '/orders/';
            quotationModel.fetch({
                data: {
                    contentType: self.contentType,
                    id         : dataId
                },

                success: function (model) {
                    return new self.EditView({
                        model   : model,
                        onlyView: onlyView
                    });
                },
                
                error: function () {
                    App.render({
                        type   : 'error',
                        message: 'Please refresh browser'
                    });
                }
            });
        }

    });

    return OrdersListView;
});