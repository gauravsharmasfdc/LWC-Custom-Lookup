/**
 * SINGLE SELECT LOOKUP
 * Pass All Public variable to configure
 * Handle onselect , onremove event in parent component
 * Call Public checkValidity method from parent to check validaity if @api required passed TRUE
 */

import { LightningElement, api, track } from "lwc";
import searchRecord from "@salesforce/apex/CustomLookupController.searchRecord";
import findRecord from "@salesforce/apex/CustomLookupController.findRecord";
export default class Lwc_CustomLookup extends LightningElement {
	@api objectName; // Object Api Name
	@api searchField; // Field Api name to use in WHERE claise
	@api otherFieldsToDisplay;
	@api fieldLabel;
	@api placeholder;
	@api labelPosition = "top"; // top, left
	@api iconName; //"Standard:account"
	@api selectedRecordId; // = "0015g00000QPoLIAA1";
	@api required = false;

	/* All private variables */

	@track searchedResult = [];

	@track selectedRecord = {};

	delayTimeout;
	isDataLoading = false;
	otherFieldsToDisplayArray = [];
	isFormValid = true;

	/* Public Methods */
	@api
	checkValidity() {
		this.isFormValid = true;
		if (this.required && !Object.keys(this.selectedRecord).length) {
			this.isFormValid = false;
		}

		return this.isFormValid;
	}

	/* All Lifecycle hooks */

	connectedCallback() {
		console.log("Connected Callbak ");

		if (this.selectedRecordId) {
			this.getSelectedRecordDetails(this.selectedRecordId);
		}
		this.fetchData("", false);
	}

	/** All Getter --- START --  */

	get fieldStyle() {
		let cssClass = "slds-form-element";
		if (this.labelPosition == "left" || this.labelPosition == "Left")
			cssClass += " slds-form--inline";
		if (!this.isFormValid) cssClass += " slds-has-error";

		return cssClass;
	}

	get otherFieldSectionStyle() {
		return this.otherFieldsToDisplayArray
			? "slds-media__body"
			: "slds-media__body slds-p-top_x-small";
	}

	get isRecordSeleted() {
		let selected = false;
		console.log(Object.keys(this.selectedRecord));
		if (Object.keys(this.selectedRecord).length > 0 || this.selectedRecordId)
			selected = true;

		return selected;
	}

	/** All Getter --- END --  */

	/* All UI Events --- START ----  */
	handleInputClick() {
		this.showDropdown();
	}

	handleInputOnChange(event) {
		window.clearTimeout(this.delayTimeout);
		let searchTerm = event.target.value;
		searchTerm = searchTerm.trim();

		if (searchTerm.length > 0) {
			this.isDataLoading = true;
			this.delayTimeout = setTimeout(() => {
				this.fetchData(searchTerm, true);
			}, 2000);
		} else {
			this.searchedResult = [];
			this.hideDropdown();
			this.isDataLoading = false;
		}
	}

	showDropdown() {
		if (this.searchedResult.length) {
			this.template
				.querySelector('[data-id="combobox"]')
				.classList.add("slds-is-open");
		}
	}

	hideDropdown() {
		this.template
			.querySelector('[data-id="combobox"]')
			.classList.remove("slds-is-open");
	}

	handleItemSelection(event) {
		let _selectedRecordId = event.currentTarget.dataset.recordId;
		console.log(this.selectedRecord.recordId);

		this.getSelectedRecordDetails(_selectedRecordId);
		this.hideDropdown();

		let eventData = {
			detail: this.selectedRecord
		};
		this.checkValidity();
		this.sendEvent("select", eventData);
	}

	handleRemoveSelection() {
		this.selectedRecord = {};
		this.selectedRecordId = null;

		let eventData = {
			detail: this.selectedRecord
		};
		this.checkValidity();
		this.sendEvent("remove", eventData);
	}
	/* All UI Events --- END ----  */

	/* Utility Methods --- START ----*/

	fetchData(searchTerm, showRecords) {
		searchRecord({
			objectName: this.objectName,
			searchTerm: searchTerm,
			searchField: this.searchField,
			otherFields: this.otherFieldsToDisplay
		})
			.then((result) => {
				console.log("result : ", result);
				this.searchedResult = this.prepareData(result);
				if (showRecords) this.showDropdown();
				this.isDataLoading = false;
			})
			.catch((err) => {});
	}

	prepareData(returnedRecords) {
		let primaryField = this.searchField;
		this.otherFieldsToDisplayArray = this.otherFieldsToDisplay
			?.trim()
			?.split(",");
		let preparedData = [];
		returnedRecords.forEach((record) => {
			let recordObject = {};
			recordObject.recordId = record["Id"];
			recordObject.field1 = record[primaryField];

			if (this.otherFieldsToDisplayArray) {
				this.otherFieldsToDisplayArray.forEach((field, index) => {
					recordObject["field" + (Number(index) + 2)] = record[field];
				});
			}

			preparedData.push(recordObject);
		});

		console.log("otherFieldsArray", this.otherFieldsToDisplayArray);
		console.log("preparedData", preparedData);

		return preparedData;
	}

	getSelectedRecordDetails(recId) {
		let _selectedRecord = {};

		_selectedRecord = this.searchedResult.find((record) => {
			if (record.recordId === recId) {
				return record;
			}
		});

		console.log("_selectedRecord :", _selectedRecord);
		if (!_selectedRecord) {
			findRecord({
				objectName: this.objectName,
				searchField: this.searchField,
				recordId: recId
			})
				.then((record) => {
					console.log("returned data :", record);
					_selectedRecord = {
						recordId: record.Id,
						field1: record[this.searchField]
					};
					this.selectedRecord = _selectedRecord;
					console.log("Selected Record :", this.selectedRecord);
				})
				.catch((err) => {});
		} else {
			delete _selectedRecord.field2;
			delete _selectedRecord.field3;
			this.selectedRecord = _selectedRecord;
		}
	}

	sendEvent(eventName, eventData) {
		const customEvent = new CustomEvent(eventName, eventData);
		this.dispatchEvent(customEvent);
	}

	/* Utility Methods --- END ----*/
}
