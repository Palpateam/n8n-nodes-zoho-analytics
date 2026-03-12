import {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { zohoApiRequest, getOrganisations, getWorkspaces, getViews, getColumns } from './GenericFunctions';

export class ZohoAnalytics implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zoho Analytics',
		name: 'zohoAnalytics',
		icon: 'file:AnalyticsLogo.svg',
		group: ['transform'],
		version: 2,
		description: 'Consume the Zoho Analytics API v2',
		defaults: {
			name: 'Zoho Analytics',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'zohoAnalyticsOAuth2Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Data',
						value: 'data',
					},
					{
						name: 'Row',
						value: 'row',
					},
					{
						name: 'Table',
						value: 'table',
					},
				],
				default: 'row',
			},

			// ----------------------------------
			//         Operations
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['row'],
					},
				},
				options: [
					{
						name: 'Add',
						value: 'add',
						description: 'Add a new row to a table',
						action: 'Add a new row to a table',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete rows from a table',
						action: 'Delete rows from a table',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update existing rows in a table',
						action: 'Update existing rows in a table',
					},
				],
				default: 'add',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['data'],
					},
				},
				options: [
					{
						name: 'Export',
						value: 'export',
						description: 'Export data from a table',
						action: 'Export data from a table',
					},
					{
						name: 'Import',
						value: 'import',
						description: 'Import JSON data into a table',
						action: 'Import data into a table',
					},
				],
				default: 'export',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['table'],
					},
				},
				options: [
					{
						name: 'Import New',
						value: 'importNew',
						description: 'Create a new table and import data',
						action: 'Create a new table',
					},
				],
				default: 'importNew',
			},

			// ----------------------------------
			//         Base Fields
			// ----------------------------------
			{
				displayName: 'Organization ID',
				name: 'organisation',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'e.g. 123456789',
				description: 'The numeric ID of your Zoho Analytics organization. Find it in Zoho Analytics under Setup > Organization.',
			},
			{
				displayName: 'Workspace ID',
				name: 'workspace',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'e.g. 123456789',
				description: 'The numeric ID of the workspace to perform actions on.',
			},
			{
				displayName: 'View ID',
				name: 'view',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'e.g. 123456789',
				displayOptions: {
					hide: {
						operation: ['importNew'],
					},
				},
				description: 'The numeric ID of the table/view to perform actions on.',
			},

			// ----------------------------------
			//         Row Fields
			// ----------------------------------
			{
				displayName: 'Columns to Add/Update',
				name: 'data',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: ['row'],
						operation: ['add', 'update'],
					},
				},
				placeholder: 'Add Column',
				default: {},
				options: [
					{
						name: 'columns',
						displayName: 'Columns',
						values: [
							{
								displayName: 'Column Name or ID',
								name: 'columnName',
								type: 'options',
								default: '',
								description: 'Column to update/add. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
								typeOptions: {
									loadOptionsMethod: 'getColumns',
									loadOptionsDependsOn: ['view'],
								},
							},
							{
								displayName: 'Column Value',
								name: 'columnValue',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Criteria',
				name: 'criteria',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['row'],
						operation: ['delete', 'update'],
					},
				},
				default: '',
				description: 'Criteria for modifying select rows eg: (("Region"=\'East\' and "Sales"<1000) or ("Region"=\'West\'))',
			},
			{
				displayName: 'Modify All Rows',
				name: 'modifyAllRows',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['row'],
						operation: ['update', 'delete'],
					},
				},
				default: false,
			},

			// ----------------------------------
			//         Data Fields
			// ----------------------------------
			{
				displayName: 'Criteria',
				name: 'criteria',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['data'],
						operation: ['export'],
					},
				},
				default: '',
			},
			{
				displayName: 'Import Type',
				name: 'importType',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['data'],
						operation: ['import'],
					},
				},
				default: 'append',
				options: [
					{ name: 'Append', value: 'append' },
					{ name: 'Truncate Add', value: 'truncateadd' },
					{ name: 'Update Add', value: 'updateadd' },
				],
			},
			{
				displayName: 'JSON Data',
				name: 'jsonData',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['data', 'table'],
						operation: ['import', 'importNew'],
					},
				},
				default: '',
				description: 'JSON array of objects to import',
			},
			{
				displayName: 'Matching Columns',
				name: 'matchingColumns',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['data'],
						operation: ['import'],
						importType: ['updateadd'],
					},
				},
				default: '',
				description: 'Comma-separated column names to match for update',
			},

			// ----------------------------------
			//         Table Fields
			// ----------------------------------
			{
				displayName: 'Table Name',
				name: 'tableName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['table'],
						operation: ['importNew'],
					},
				},
				default: '',
			},
		],
	};

	methods = {
		loadOptions: {
			getOrganisations,
			getWorkspaces,
			getViews,
			getColumns,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const orgIDRaw = this.getNodeParameter('organisation', i) as string | number || '';
				const workspaceIDRaw = this.getNodeParameter('workspace', i) as string | number || '';
				const orgID = String(orgIDRaw).trim();
				const workspaceID = String(workspaceIDRaw).trim();

				// Guard: workspace ID is required for all operations
				if (!workspaceID) {
					throw new NodeOperationError(
						this.getNode(),
						`Workspace ID is empty or not resolved. Raw value: "${workspaceIDRaw}". ` +
						`This typically happens when loadOptions fields are not properly cached during scheduled execution. ` +
						`Try setting the workspace ID directly as a fixed value or expression instead of using the dropdown.`,
						{ itemIndex: i },
					);
				}



				if (resource === 'row') {
					const viewIDRaw = this.getNodeParameter('view', i) as string | number || '';
					const viewID = String(viewIDRaw).trim();

					// Guard: view ID is required for row operations
					if (!viewID) {
						throw new NodeOperationError(
							this.getNode(),
							`View ID is empty or not resolved. Raw value: "${viewIDRaw}". ` +
							`Try setting the view ID directly as a fixed value or expression instead of using the dropdown.`,
							{ itemIndex: i },
						);
					}

					const endpoint = `/restapi/v2/workspaces/${encodeURIComponent(workspaceID)}/views/${encodeURIComponent(viewID)}/rows`;

					if (operation === 'add') {
						const columnData = this.getNodeParameter('data.columns', i, []) as Array<{ columnName: string; columnValue: string }>;
						const columns: IDataObject = {};
						columnData.forEach(col => {
							columns[col.columnName] = col.columnValue;
						});

						const qs = { CONFIG: JSON.stringify({ columns }) };
						const responseData = await zohoApiRequest.call(this, 'POST', endpoint, qs, {}, orgID);
						returnData.push(...this.helpers.returnJsonArray(responseData.data));

					} else if (operation === 'update') {
						const modifyAll = this.getNodeParameter('modifyAllRows', i, false) as boolean;
						const criteria = this.getNodeParameter('criteria', i, '') as string;
						const columnData = this.getNodeParameter('data.columns', i, []) as Array<{ columnName: string; columnValue: string }>;
						const columns: IDataObject = {};
						columnData.forEach(col => {
							columns[col.columnName] = col.columnValue;
						});

						const config: IDataObject = { columns };
						if (modifyAll) {
							config.updateAllRows = true;
						} else {
							config.criteria = criteria;
						}

						const qs = { CONFIG: JSON.stringify(config) };
						const responseData = await zohoApiRequest.call(this, 'PUT', endpoint, qs, {}, orgID);
						returnData.push(...this.helpers.returnJsonArray(responseData.data));

					} else if (operation === 'delete') {
						const modifyAll = this.getNodeParameter('modifyAllRows', i, false) as boolean;
						const criteria = this.getNodeParameter('criteria', i, '') as string;

						const config: IDataObject = {};
						if (modifyAll) {
							config.deleteAllRows = true;
						} else {
							config.criteria = criteria;
						}

						const qs = { CONFIG: JSON.stringify(config) };
						const responseData = await zohoApiRequest.call(this, 'DELETE', endpoint, qs, {}, orgID);
						returnData.push(...this.helpers.returnJsonArray(responseData.data));
					}
				} else if (resource === 'data') {
					const viewIDRaw = this.getNodeParameter('view', i) as string | number || '';
					const viewID = String(viewIDRaw).trim();

					// Guard: view ID is required for data operations
					if (!viewID) {
						throw new NodeOperationError(
							this.getNode(),
							`View ID is empty or not resolved. Raw value: "${viewIDRaw}". ` +
							`Try setting the view ID directly as a fixed value or expression instead of using the dropdown.`,
							{ itemIndex: i },
						);
					}

					const endpoint = `/restapi/v2/workspaces/${encodeURIComponent(workspaceID)}/views/${encodeURIComponent(viewID)}/data`;

					if (operation === 'export') {
						const criteria = this.getNodeParameter('criteria', i, '') as string;
						const config: IDataObject = { responseFormat: 'json' };
						if (criteria) {
							config.criteria = criteria;
						}

						const qs = { CONFIG: JSON.stringify(config) };
						const responseData = await zohoApiRequest.call(this, 'GET', endpoint, qs, {}, orgID);
						if (Array.isArray(responseData.data)) {
							returnData.push(...this.helpers.returnJsonArray(responseData.data));
						} else {
							returnData.push({ json: responseData.data || responseData });
						}

					} else if (operation === 'import') {
						const importType = this.getNodeParameter('importType', i, 'append') as string;
						let jsonData = this.getNodeParameter('jsonData', i, '') as string;
						if (typeof jsonData === 'object') {
							jsonData = JSON.stringify(jsonData);
						}

						const matchingColumns = this.getNodeParameter('matchingColumns', i, '') as string;
						const matchColsArr = matchingColumns ? matchingColumns.split(',').map(c => c.trim()) : [];

						const config: IDataObject = {
							importType,
							fileType: 'json',
							autoIdentify: false,
							retainColumnNames: true,
						};
						if (matchColsArr.length > 0) {
							config.matchingColumns = matchColsArr;
						}
						const qs = { CONFIG: JSON.stringify(config) };

						const body = { DATA: jsonData };
						const responseData = await zohoApiRequest.call(this, 'POST', endpoint, qs, body, orgID, true);
						returnData.push(...this.helpers.returnJsonArray(responseData.data));
					}
				} else if (resource === 'table') {
					const endpoint = `/restapi/v2/workspaces/${encodeURIComponent(workspaceID)}/data`;

					if (operation === 'importNew') {
						const tableName = this.getNodeParameter('tableName', i) as string;
						let jsonData = this.getNodeParameter('jsonData', i, '') as string;
						if (typeof jsonData === 'object') {
							jsonData = JSON.stringify(jsonData);
						}

						const config = {
							tableName,
							fileType: 'json',
							autoIdentify: false,
							retainColumnNames: true,
						};
						const qs = { CONFIG: JSON.stringify(config) };
						const body = { DATA: jsonData };
						const responseData = await zohoApiRequest.call(this, 'POST', endpoint, qs, body, orgID, true);
						returnData.push(...this.helpers.returnJsonArray(responseData.data));
					}
				}

			} catch (e) {
				const error = e as any;
				if (this.continueOnFail()) {
					returnData.push({ json: this.getInputData(i)[0].json, error, pairedItem: i });
				} else {
					if (error.context) {
						error.context.itemIndex = i;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
				}
			}
		}

		return [returnData];
	}
}
