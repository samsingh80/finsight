sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment"
], (Controller,Fragment) => {
    "use strict";

    return Controller.extend("finsight.controller.LaunchView", {
        onInit() {
          const oModel = new sap.ui.model.json.JSONModel();
          oModel.loadData("model/kpis.json");
          
          oModel.attachRequestCompleted(() => {
            const aKpis = oModel.getProperty("/kpis");
            const oSubSection = this.byId("overViewPageSection");

            var oChartData = {
              revenueDataset: {
                  dimensions: [{
                      name: "Region",
                      value: "{Region}"
                  }],
                  measures: [{
                      name: "Revenue",
                      value: "{Revenue}"
                  }],
                  data: [
                      { Region: "North America", Revenue: 120 },
                      { Region: "Europe", Revenue: 95 },
                      { Region: "Asia", Revenue: 130 },
                      { Region: "South America", Revenue: 70 }
                  ]
              },
              spendDataset: {
                  dimensions: [{
                      name: "Category",
                      value: "{Category}"
                  }],
                  measures: [{
                      name: "Amount",
                      value: "{Amount}"
                  }],
                  data: [
                      { Category: "Marketing", Amount: 45 },
                      { Category: "R&D", Amount: 70 },
                      { Category: "Operations", Amount: 55 },
                      { Category: "HR", Amount: 30 }
                  ]
              }
          };
          let oChartModel = new sap.ui.model.json.JSONModel(oChartData);
    
          this.getView().setModel(oChartModel, "chartModel");



            const oCarousel = new sap.m.Carousel({
              width: "100%",
              height: "auto",
              pageIndicatorPlacement: "Bottom",
              loop: false,
              showPageIndicator: true
            });
          
            // Split into groups of 6
            for (let i = 0; i < aKpis.length; i +=6) {
               const aGroup = aKpis.slice(i, i + 6)
              const oHBox = new sap.m.HBox({
                wrap: "NoWrap",
                columnGap: "1rem",
                class: "noHBoxBorder" ,
                justifyContent: "Start",
                items: []
              });
          
              aGroup.forEach(kpi => {
                const oCard = new sap.f.Card({
                  class: "cardStyle noHBoxBorder",
                  width: "250px",
                  header: new sap.f.cards.Header({
                    title: kpi.title,
                    subtitle: kpi.subtitle
                  }),
                  content: new sap.m.VBox({
                    items: [
                      new sap.m.Text({ text: kpi.value, class: "cardValue" }),
                      new sap.m.Text({
                        text: kpi.extra,
                        class: kpi.extraType === "positive" ? "cardPositive" : "cardNegative"
                      })
                    ]
                  })
                });
                oHBox.addItem(oCard);
              });
          
              oCarousel.addPage(oHBox);
            }
          
            oSubSection.addBlock(oCarousel);
          });

          var oNewsModel = new sap.ui.model.json.JSONModel({
            newsItems: [
                { headline: "CNBC: New round of tariff announcements impact Asia Pacific markets." },
                { headline: "Bloomberg Green: new regulations for APAC region" },
                { headline: "BBC Green: New emission regulations for APAC region" },
                { headline: "CNBC: Innovative ways companies turn waste into resources: A New Era!" }
            ]
        });
        this.getView().setModel(oNewsModel, "news");
         },


        onOpenDialog: function () {
          // Check if the dialog is already loaded
          if (!this._oDialog) {
              Fragment.load({
                  name: "finsight.fragment.ChatBox", // Path to the fragment (no .fragment.xml extension)
                  type: "XML",
                  controller: this
              }).then(oDialog => {
                  this._oDialog = oDialog;
                  this.getView().addDependent(oDialog); // lifecycle management
                  oDialog.open();
              });
          } else {
              this._oDialog.open();
          }
      }
    });
}); 