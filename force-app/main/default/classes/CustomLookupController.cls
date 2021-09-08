public with sharing class CustomLookupController {
	/**
	 * #description             : This class provide data to custom lookup LWC component
	 * @author                  : Gaurav Sharma
	 * @last Modified Date / BY : 01/08/2021, Gaurav Sharma
	 * Ver      Date            Author              Modification
	 * 1.0      01-Aug-2021     Gaurav Sharma       Initial Version
	 */

	@AuraEnabled(cacheable=true)
	public static list<sObject> searchRecord(
		String objectName,
		String searchTerm,
		String searchField,
		String otherFields
	) {
		try {
			String searchKeyword = '\'' + '%' + searchTerm + '%' + '\'';
			if (String.isNotBlank(otherFields))
				otherFields = ', ' + otherFields;
			else {
				otherFields = '';
			}
			System.debug('otherFields:' + otherFields);
			String query =
				'SELECT Id, ' +
				searchField +
				' ' +
				otherFields +
				' ' +
				' FROM ' +
				objectName;
			if (String.isNotBlank(searchTerm)) {
				query +=
					' WHERE ' +
					searchField +
					' LIKE ' +
					searchKeyword +
					' ORDER BY ' +
					searchField +
					' LIMIT 50';
			}else{
				query +=' ORDER BY LastViewedDate DESC LIMIT 5 ';
			}

			System.debug('query : ' + query);
			return Database.query(query);
		} catch (Exception e) {
			throw new AuraHandledException(e.getMessage());
		}
	}

	@AuraEnabled
	public static sObject findRecord(
		String objectName,
		String searchField,
		String recordId
	) {
		try {
			String recId = '\'' + recordId + '\'';
			String query =
				'SELECT ID, ' +
				searchField +
				' FROM ' +
				objectName +
				' WHERE ID=' +
				recId;
			System.debug('Query :' + query);
			return Database.query(query);
		} catch (Exception e) {
			throw new AuraHandledException(e.getMessage());
		}
	}
}
