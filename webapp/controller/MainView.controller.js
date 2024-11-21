sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], function (Controller, MessageBox) {
    "use strict";

    return Controller.extend("myapp.controller.MainView", {
        onInit: function () {
            const oModel = this.getView().getModel("data");
            const aData = oModel.getProperty("/butterflies");
        
            if (Array.isArray(aData)) {
                aData.forEach(row => (row.editable = false)); // Domyślnie wszystkie pola nieedytowalne
                oModel.refresh();
                console.log("Aplikacja zainicjowana. Pola są domyślnie nieedytowalne.");
            } else {
                sap.m.MessageBox.error("Dane nie zostały poprawnie załadowane z pliku data.json!");
            }
        },                     

        onAddRow: function () {
            const oModel = this.getView().getModel("data");
            const aData = oModel.getProperty("/butterflies");
            if (Array.isArray(aData)) {
                aData.unshift({ // Dodanie nowego wiersza na początku
                    GUID: Math.random().toString(36).substr(2, 9),
                    Name: "",
                    Family: "",
                    Location: "",
                    Wingspan: "",
                    Price: ""
                });
                oModel.refresh(); // Odświeżenie modelu, aby tabela zaktualizowała się automatycznie
            } else {
                sap.m.MessageBox.error("Dane nie są w formacie tablicy!");
            }
        },              

        onDeleteRow: function () {
            const oTable = this.byId("butterflyTable");
            const oModel = this.getView().getModel("data");
            const aSelectedIndices = oTable.getSelectedIndices();
            const aData = oModel.getProperty("/butterflies");
        
            if (aSelectedIndices.length === 0) {
                sap.m.MessageBox.error("Proszę zaznaczyć wiersze do usunięcia.");
                return;
            }
        
            sap.m.MessageBox.confirm("Czy na pewno chcesz usunąć zaznaczone wiersze?", {
                actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === sap.m.MessageBox.Action.YES) {
                        const aRemainingData = aData.filter((_, index) => !aSelectedIndices.includes(index));
                        oModel.setProperty("/butterflies", aRemainingData);
                        oModel.refresh();
                    }
                }
            });
        },               

        onEditRow: function () {
            const oModel = this.getView().getModel("data");
            const aColumns = [
                { key: "Default", text: "Wybierz kolumnę" },
                { key: "Name", text: "Nazwa" },
                { key: "Family", text: "Rodzina" },
                { key: "Location", text: "Lokalizacja" },
                { key: "Wingspan", text: "Rozpiętość skrzydeł" },
                { key: "Price", text: "Cena" }
            ];
        
            if (!this._oEditDialog) {
                // Tworzymy dialog, jeśli jeszcze nie istnieje
                this._oEditDialog = new sap.m.Dialog({
                    title: "Edycja kolumny",
                    content: [
                        new sap.m.VBox({
                            items: [
                                new sap.m.Label({ text: "Wybierz kolumnę do edycji", labelFor: "columnEditSelect" }),
                                new sap.m.Select("columnEditSelect", {
                                    items: aColumns.map(column => new sap.ui.core.Item({
                                        key: column.key,
                                        text: column.text
                                    }))
                                }).addStyleClass("sapUiSmallMarginBottom")
                            ]
                        }).addStyleClass("sapUiContentPadding")
                    ],
                    buttons: [
                        new sap.m.Button({
                            text: "Zastosuj",
                            press: () => {
                                const sSelectedKey = sap.ui.getCore().byId("columnEditSelect").getSelectedKey();
                                if (sSelectedKey) {
                                    this._applyEditToColumn(sSelectedKey);
                                    this._oEditDialog.close();
                                } else {
                                    sap.m.MessageBox.error("Wybierz kolumnę do edycji!");
                                }
                            }
                        }),
                        new sap.m.Button({
                            text: "Anuluj",
                            press: () => this._oEditDialog.close()
                        })
                    ]
                });
        
                this.getView().addDependent(this._oEditDialog);
            }
        
            // Otwórz dialog
            this._oEditDialog.open();
        },
        
        _applyEditToColumn: function (sColumnKey) {
            const oModel = this.getView().getModel("data");
            const aData = oModel.getProperty("/butterflies");
        
            if (Array.isArray(aData)) {
                aData.forEach(row => {
                    if (sColumnKey === "Wingspan" || sColumnKey === "Price") {
                        // Jeśli wartość to liczba, mnożymy przez 3.3 i zaokrąglamy do 2 miejsc po przecinku
                        const newValue = (parseFloat(row[sColumnKey]) || 0) * 3.3;
                        row[sColumnKey] = newValue.toFixed(2); // Zaokrąglenie do dwóch miejsc
                    } else if (typeof row[sColumnKey] === "string") {
                        // Jeśli wartość to tekst, dodajemy '[edited]'
                        row[sColumnKey] += " [ed]";
                    }
                });
                oModel.refresh(); // Odśwież model, aby tabela zaktualizowała się
                sap.m.MessageToast.show(`Kolumna "${sColumnKey}" została zmodyfikowana.`);
            } else {
                sap.m.MessageBox.error("Nie udało się edytować danych. Brak poprawnych danych.");
            }
        },                      

        onDuplicateRow: function () {
            const oTable = this.byId("butterflyTable");
            const oModel = this.getView().getModel("data");
            const aData = oModel.getProperty("/butterflies");
            const iSelectedIndex = oTable.getSelectedIndex();
        
            if (iSelectedIndex === -1) {
                sap.m.MessageBox.error("Proszę wybrać wiersz do duplikowania.");
                return;
            }
        
            const oDuplicate = { ...aData[iSelectedIndex], GUID: Math.random().toString(36).substr(2, 9) };
            aData.unshift(oDuplicate); // Wstawienie zduplikowanego wiersza na początku
            oModel.refresh();
        },            

        onSumColumn: function () {
            const oModel = this.getView().getModel("data");
            const aData = oModel.getProperty("/butterflies");
        
            const iSum = aData.reduce((acc, row) => acc + (parseFloat(row.Wingspan) || 0), 0);
            sap.m.MessageBox.information(`Suma wartości w kolumnie "Wingspan": ${iSum}`);
        },        

        onSearch: function (oEvent) {
            const sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
            const oTable = this.byId("butterflyTable");
            const oBinding = oTable.getBinding("rows");
        
            if (!oBinding) return;
        
            const aFilters = [];
            if (sQuery) {
                aFilters.push(new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, sQuery),
                        new sap.ui.model.Filter("Family", sap.ui.model.FilterOperator.Contains, sQuery),
                        new sap.ui.model.Filter("Location", sap.ui.model.FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }
        
            oBinding.filter(aFilters);
        },

        onEditMode: function () {
            const oModel = this.getView().getModel("data");
            const aData = oModel.getProperty("/butterflies");
        
            if (Array.isArray(aData)) {
                // Zapisujemy oryginalne dane na potrzeby przywracania
                this._originalData = JSON.parse(JSON.stringify(aData));
        
                // Włączamy tryb edycji
                aData.forEach(row => (row.editable = true));
                oModel.refresh();
                console.log("Tryb edycji włączony. Dane oryginalne zapisane.");
            } else {
                sap.m.MessageBox.error("Nie udało się zainicjować trybu edycji. Brak poprawnych danych.");
            }
        },                                     

        onSaveEdit: function () {
            const oModel = this.getView().getModel("data");
            const aData = oModel.getProperty("/butterflies");
        
            sap.m.MessageBox.confirm("Czy na pewno chcesz zapisać zmiany?", {
                actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                onClose: (sAction) => {
                    if (sAction === sap.m.MessageBox.Action.YES) {
                        // Zapisujemy zmiany i wyłączamy tryb edycji
                        if (Array.isArray(aData)) {
                            aData.forEach(row => (row.editable = false));
                            oModel.refresh(); // Odśwież model
                            console.log("Zmiany zapisane. Tryb edycji wyłączony.");
                        } else {
                            sap.m.MessageBox.error("Nie udało się zapisać zmian. Brak poprawnych danych.");
                        }
                    } else if (sAction === sap.m.MessageBox.Action.NO) {
                        // Przywracamy oryginalne dane
                        if (this._originalData) {
                            oModel.setProperty("/butterflies", JSON.parse(JSON.stringify(this._originalData)));
                            oModel.refresh();
                            console.log("Zmiany cofnięte. Dane przywrócone do stanu pierwotnego.");
                        } else {
                            sap.m.MessageBox.error("Nie udało się przywrócić oryginalnych danych.");
                        }
                    }
                }
            });
        },
        onCalculateSum: function () {
            const oModel = this.getView().getModel("data");
            const aColumns = [
                { key: "default", text: "Wybierz kolumnę"},
                { key: "Name", text: "Nazwa" },
                { key: "Family", text: "Rodzina" },
                { key: "Location", text: "Lokalizacja" },
                { key: "Wingspan", text: "Rozpiętość skrzydeł" },
                { key: "Weight", text: "Waga" },
                { key: "Price", text: "Cena" },
                { key: "Abundance", text: "Liczebność" },
                { key: "Color Rating", text: "Ocena koloru" },
                { key: "Habitat", text: "Siedlisko" },
                { key: "Lifespan", text: "Długość życia" },
                { key: "Migration Pattern", text: "Wzorzec migracji" },
                { key: "Threat Level", text: "Poziom zagrożenia" },
            ];
        
            if (!this._oDialog) {
                // Tworzymy dialog, jeśli jeszcze nie istnieje
                this._oDialog = new sap.m.Dialog({
                    title: "Sumowanie wartości",
                    content: [
                        new sap.m.VBox({
                            items: [
                                new sap.m.Label({ text: "Kolumna", labelFor: "columnSelect" }),
                                new sap.m.Select("columnSelect", {
                                    items: aColumns.map(column => new sap.ui.core.Item({
                                        key: column.key,
                                        text: column.text
                                    }))
                                }).addStyleClass("sapUiSmallMarginBottom"), // Dodajemy margines
                                new sap.m.Label({ text: "Zsumowana wartość" }),
                                new sap.m.Text({ id: "sumValue", text: "0.00" }).addStyleClass("sapUiSmallMarginTop")
                            ]
                        }).addStyleClass("sapUiContentPadding") // Margines wokół kontenera
                    ],
                    buttons: [
                        new sap.m.Button({
                            text: "Zamknij",
                            press: () => this._oDialog.close()
                        })
                    ]
                });
        
                this.getView().addDependent(this._oDialog);
            }
        
            // Obsługa zmiany w Select
            const oSelect = sap.ui.getCore().byId("columnSelect");
            oSelect.attachChange(() => {
                const sSelectedKey = oSelect.getSelectedKey();
                const aData = oModel.getProperty("/butterflies");
        
                // Sprawdzenie typu danych w kolumnie
                const isNumeric = aData.every(row => !isNaN(parseFloat(row[sSelectedKey])));
                if (!isNumeric) {
                    // Kolumna zawiera dane tekstowe
                    sap.ui.getCore().byId("sumValue").setText("------------");
                    return;
                }
        
                // Obliczanie sumy na podstawie wybranej kolumny
                const iSum = aData.reduce((acc, row) => {
                    const value = parseFloat(row[sSelectedKey]) || 0;
                    return acc + value;
                }, 0);
        
                // Wyświetlenie wyniku
                sap.ui.getCore().byId("sumValue").setText(iSum.toFixed(2));
            });
        
            // Otwórz dialog
            this._oDialog.open();
        }                                                                                 
    });
});
