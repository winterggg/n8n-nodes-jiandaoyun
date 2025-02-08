import _ from 'lodash';
import {
	BINARY_ENCODING,
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IRequestOptions,
	NodeOperationError,
} from 'n8n-workflow';

function getPaginationParams(
	displayOptions: INodeTypeDescription['properties'][number]['displayOptions'],
	hasSkipCount: boolean = true,
): INodeTypeDescription['properties'][number][] {
	const ret: INodeTypeDescription['properties'][number][] = [
		{
			displayName: 'Return Count',
			name: 'returnCount',
			type: 'number',
			typeOptions: {
				maxValue: 100,
				minValue: 1,
				numberPrecision: 0,
			},
			default: 100,
			description: 'The number of records to be retrieved in a single request',
			displayOptions,
		},
	];
	if (hasSkipCount) {
		ret.push({
			displayName: 'Skip Count',
			name: 'skipCount',
			type: 'number',
			typeOptions: {
				minValue: 0,
			},
			default: 0,
			description: 'The number of records to be skipped',
			displayOptions,
		});
	}
	return ret;
}

export class Jiandaoyun implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jiandaoyun',
		name: 'jiandaoyun',
		icon: {
			light: 'file:jiandaoyun.light.png',
			dark: 'file:jiandaoyun.dark.png',
		},
		group: ['input'],
		version: 1,
		subtitle: '=☁️ {{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume Jiandaoyun API',
		defaults: {
			name: 'Jiandaoyun',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'jiandaoyunApi',
				required: true,
			},
		],
		properties: [
			// ----------------------------------
			//         resource
			// ----------------------------------
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'App',
						value: 'app',
					},
					// {
					// 	name: 'Corp',
					// 	value: 'corp',
					// },
					{
						name: 'Data',
						value: 'data',
					},
					{
						name: 'Entry',
						value: 'entry',
					},
					{
						name: 'File',
						value: 'file',
					},
					{
						name: 'Workflow',
						value: 'workflow',
					},
				],
				default: 'data',
			},

			// ----------------------------------
			//         option
			// ----------------------------------
			// app
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['app'],
					},
				},
				options: [
					{
						name: 'Get Apps',
						value: 'getApps',
						description: 'Returns all app information',
						action: 'Get all app information',
					},
					{
						name: 'Get Entries',
						value: 'getEntries',
						description: 'Returns all entry information of a certain app',
						action: 'Get all entry information of a certain app',
					},
				],
				default: 'getApps',
			},
			// entry
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['entry'],
					},
				},
				options: [
					{
						name: 'Get Fields',
						value: 'getFields',
						description: 'Returns all field information of a certain entry',
						action: 'Get all field information of a certain entry',
					},
				],
				default: 'getFields',
			},
			// data
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
						name: 'Create a Data Record',
						value: 'createDataRecord',
						action: 'Create a data record',
					},
					{
						name: 'Create Many Data Records',
						value: 'createManyDataRecords',
						action: 'Create many data records',
					},
					{
						name: 'Delete a Data Record',
						value: 'deleteDataRecord',
						description: 'Delete one record from the form according to the specified data ID',
						action: 'Delete a data record',
					},
					{
						name: 'Delete Many Data Record',
						value: 'deleteManyDataRecord',
						description:
							'Delete multiple records from the form according to the specified data ID. A maximum of 100 records can be deleted at a time.',
						action: 'Delete many data records',
					},
					{
						name: 'Get a Single Data Record',
						value: 'getSingleDataRecord',
						description: 'Returns a single data record on a certain data ID',
						action: 'Get a single data record',
					},
					{
						name: 'Get Many Data Records',
						value: 'getManyDataRecords',
						description: 'Returns many data records sorted in ascending order of data ID',
						action: 'Get many data records',
					},
					{
						name: 'Update a Data Record',
						value: 'updateDataRecord',
						action: 'Update a data record',
					},
					{
						name: 'Update Many Data Records',
						value: 'updateManyDataRecords',
						description: 'Updates many data records. A maximum of 100 records can be updated.',
						action: 'Update many data records',
					},
				],
				default: 'getSingleDataRecord',
			},
			// file
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['file'],
					},
				},
				options: [
					{
						name: 'Get Upload Token',
						value: 'getUploadToken',
						description: 'Returns 100 upload tokens',
						action: 'Get 100 upload tokens',
					},
					{
						name: 'Upload File',
						value: 'uploadFile',
						action: 'Upload file',
					},
				],
				default: 'getUploadToken',
			},
			// workflow
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['workflow'],
					},
				},
				options: [
					// {
					// 	name: 'Get Approval Comments',
					// 	value: 'getApprovalComments',
					// 	description: 'Returns approval comments for one workflow form record',
					// 	action: 'Get approval comments for one workflow form record'
					// },
					{
						name: 'Get Workflow Instance',
						value: 'getWorkflowInstance',
						description: 'Returns a workflow instance',
						action: 'Get a workflow instance',
					},
					{
						name: 'Get Workflow Tasks',
						value: 'getWorkflowTasks',
						description: 'Returns the current tasks of a user',
						action: 'Get the current tasks of a user',
					},
					{
						name: 'Submit Workflow Task',
						value: 'submitWorkflowTask',
						action: 'Submit workflow task',
					},
				],
				default: 'getWorkflowInstance',
			},

			// ----------------------------------
			//         shared
			// ----------------------------------
			{
				displayName: 'App ID',
				name: 'appId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					hide: {
						resource: ['workflow'],
						operation: ['getApps'],
					},
				},
			},

			{
				displayName: 'Entry ID',
				name: 'entryId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					hide: {
						resource: ['workflow'],
						operation: ['getApps', 'getEntries'],
					},
				},
			},
			// ----------------------------------
			//         app
			// ----------------------------------
			...getPaginationParams({
				show: {
					resource: ['app'],
					operation: ['getApps', 'getEntries'],
				},
			}),

			// ----------------------------------
			//         entry
			// ----------------------------------
			// empty for now

			// ----------------------------------
			//         data
			// ----------------------------------
			// getSingleDataRecord
			{
				displayName: 'Data ID',
				name: 'dataId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['data'],
						operation: ['getSingleDataRecord'],
					},
				},
			},
			// getManyDataRecords
			// limit
			...getPaginationParams(
				{
					show: {
						resource: ['data'],
						operation: ['getManyDataRecords'],
					},
				},
				false,
			),
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Data ID',
						name: 'dataId',
						type: 'string',
						default: '',
						description:
							'ID of the last record from the last query. Leave blank in case no data is returned.',
					},
					// fields
					{
						displayName: 'Field Names or IDs',
						name: 'fields',
						type: 'multiOptions',
						options: [],
						typeOptions: {
							loadOptionsMethod: 'getFieldOptions',
							loadOptionsDependsOn: ['appId', 'entryId'],
						},
						default: [], // Initially selected options
						description:
							'Data fields to be queried, not required. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
					},
					// filter
					{
						displayName: 'Filter (JSON)',
						name: 'filter',
						type: 'json',
						default: '{\n    "rel": "and",\n    "cond": [\n    ]\n}',
						description:
							'Filter condition, check the <a href="https://hc.jiandaoyun.com/open/14220#%E6%95%B0%E6%8D%AE%E7%AD%9B%E9%80%89%E5%99%A8">API doc</a> for more details',
					},
				],
				displayOptions: {
					show: {
						resource: ['data'],
						operation: ['getManyDataRecords'],
					},
				},
			},
			// createDataRecord & updateDataRecord & updateManyDataRecords & deleteDataRecord & deleteManyDataRecord
			{
				displayName: 'Data Record ID List (JSON)',
				name: 'dataRecordIdsJson',
				type: 'json',
				default: '[]',
				required: true,
				description: 'Array of IDs for the data to be updated',
				displayOptions: {
					show: {
						resource: ['data'],
						operation: ['updateManyDataRecords', 'deleteManyDataRecord'],
					},
				},
			},
			{
				displayName: 'Data ID',
				name: 'dataId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['data'],
						operation: ['updateDataRecord', 'deleteDataRecord'],
					},
				},
			},
			// TODO: 可以用 Resource mapper 来实现
			{
				displayName: 'Using JSON',
				name: 'usingJson',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						resource: ['data'],
						operation: ['createDataRecord', 'updateDataRecord', 'updateManyDataRecords'],
					},
				},
			},
			{
				displayName: 'Data Record (JSON)',
				name: 'dataRecordJson',
				type: 'json',
				default: '{\n    "_widget_xxxx": {\n        "value": 42\n    }\n}',
				description:
					'Data records in JSON format, check the <a href="https://hc.jiandaoyun.com/open/14222">create api doc</a>, <a href="https://hc.jiandaoyun.com/open/14224">update api doc</a> or <a href="https://hc.jiandaoyun.com/open/14224">update-many api doc</a> for more details',
				displayOptions: {
					show: {
						resource: ['data'],
						operation: ['createDataRecord', 'updateDataRecord', 'updateManyDataRecords'],
						usingJson: [true],
					},
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Data Creator',
						name: 'dataCreator',
						type: 'string',
						default: '',
						description:
							'The member who submits data. The value for "data_creator" is the member\'s NO.. You can obtain the member number through the contact APIs.',
					},
					{
						displayName: 'Is Start Workflow',
						name: 'isStartWorkflow',
						type: 'boolean',
						default: false,
						description: 'Whether to initiate workflows (Only work in workflow forms)',
					},
					{
						displayName: 'Is Start Trigger',
						name: 'isStartTrigger',
						type: 'boolean',
						default: false,
						description: 'Whether to trigger Automations',
					},
					{
						displayName: 'Transaction ID',
						name: 'transactionId',
						type: 'string',
						default: '',
						description:
							'Transaction ID (transaction_id) is used to bind a batch of uploaded files. If the data includes attachments or images, the transaction_id must be the same as that in the <a href="https://hc.jiandaoyun.com/open/13287">API for accessing upload credentials and URL</a>.',
					},
				],
				displayOptions: {
					show: {
						resource: ['data'],
						operation: ['createDataRecord'],
					},
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Is Start Trigger',
						name: 'isStartTrigger',
						type: 'boolean',
						default: false,
						description: 'Whether to trigger Automations',
					},
					{
						displayName: 'Transaction ID',
						name: 'transactionId',
						type: 'string',
						default: '',
						description:
							'Transaction ID (transaction_id) is used to bind a batch of uploaded files. If the data includes attachments or images, the transaction_id must be the same as that in the <a href="https://hc.jiandaoyun.com/open/13287">API for accessing upload credentials and URL</a>.',
					},
				],
				displayOptions: {
					show: {
						resource: ['data'],
						operation: ['updateDataRecord'],
					},
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Transaction ID',
						name: 'transactionId',
						type: 'string',
						default: '',
						description:
							'Transaction ID (transaction_id) is used to bind a batch of uploaded files. If the data includes attachments or images, the transaction_id must be the same as that in the <a href="https://hc.jiandaoyun.com/open/13287">API for accessing upload credentials and URL</a>.',
					},
				],
				displayOptions: {
					show: {
						resource: ['data'],
						operation: ['updateManyDataRecords'],
					},
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Is Start Trigger',
						name: 'isStartTrigger',
						type: 'boolean',
						default: false,
						description: 'Whether to trigger Automations',
					},
				],
				displayOptions: {
					show: {
						resource: ['data'],
						operation: ['deleteDataRecord'],
					},
				},
			},
			// createManyDataRecords
			{
				displayName: 'Data Record List (JSON)',
				name: 'dataRecordJson',
				type: 'json',
				default:
					'[\n    {\n        "_widget_xxxx": {\n            "value": 42\n        }\n    }\n]',
				description:
					'Data records in JSON format, check the <a href="https://hc.jiandaoyun.com/open/14223">API doc</a> for more details',
				displayOptions: {
					show: {
						resource: ['data'],
						operation: ['createManyDataRecords'],
					},
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Data Creator',
						name: 'dataCreator',
						type: 'string',
						default: '',
						description:
							'The member who submits data. The value for "data_creator" is the member\'s NO.. You can obtain the member number through the contact APIs.',
					},
					{
						displayName: 'Is Start Workflow',
						name: 'isStartWorkflow',
						type: 'boolean',
						default: false,
						description: 'Whether to initiate workflows (Only work in workflow forms)',
					},
					{
						displayName: 'Transaction ID',
						name: 'transactionId',
						type: 'string',
						default: '',
						description:
							'Transaction ID (transaction_id) is used to bind a batch of uploaded files. If the data includes attachments or images, the transaction_id must be the same as that in the <a href="https://hc.jiandaoyun.com/open/13287">API for accessing upload credentials and URL</a>.',
					},
				],
				displayOptions: {
					show: {
						resource: ['data'],
						operation: ['createManyDataRecords'],
					},
				},
			},
			// ----------------------------------
			//         data
			// ----------------------------------
			// getUploadToken
			{
				displayName: 'Transaction ID',
				name: 'transactionId',
				type: 'string',
				required: true,
				default: '',
				description:
					'This parameter needs to be generated by yourself. It is recommended to use the UUID format, check the <a href="https://hc.jiandaoyun.com/open/13287">API doc</a> for more details.',
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['getUploadToken'],
					},
				},
			},
			// uploadFile
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				default: '',
				description: 'File upload URL',
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['uploadFile'],
					},
				},
			},
			{
				displayName: 'Token',
				name: 'token',
				// eslint-disable-next-line n8n-nodes-base/node-param-type-options-password-missing
				type: 'string',
				required: true,
				default: '',
				description: 'File upload credentials',
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['uploadFile'],
					},
				},
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['uploadFile'],
					},
				},
				placeholder: '',
				hint: 'The name of the input binary field containing the file to be uploaded',
			},

			// ----------------------------------
			//         workflow
			// ----------------------------------
			// shared
			{
				displayName: 'User Name',
				name: 'username',
				type: 'string',
				description: 'It refers to the User No. in Contacts.',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['workflow'],
						operation: ['getWorkflowTasks', 'submitWorkflowTask'],
					},
				},
			},
			{
				displayName: 'Instance ID',
				name: 'instanceId',
				type: 'string',
				description: 'Instance ID is the same as data_id',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['workflow'],
						operation: ['getWorkflowInstance', 'submitWorkflowTask'],
					},
				},
			},
			// // getApprovalComments
			// {
			// 	displayName: 'Data ID',
			// 	name: 'dataId',
			// 	type: 'string',
			// 	description: 'Workflow form data ID',
			// 	default: '',
			// 	required: true,
			// 	displayOptions: {
			// 		show: {
			// 			resource: ['workflow'],
			// 			operation: ['getApprovalComments'],
			// 		},
			// 	},
			// },
			// getWorkflowInstance
			{
				displayName: 'Return Tasks',
				name: 'returnTasks',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['workflow'],
						operation: ['getWorkflowInstance'],
					},
				},
			},
			// getWorkflowTasks
			...getPaginationParams({
				show: {
					resource: ['workflow'],
					operation: ['getWorkflowTasks'],
				},
			}),
			// submitWorkflowTasks
			{
				displayName: 'Task ID',
				name: 'taskId',
				type: 'string',
				description: 'Task ID (should correspond with the user name)',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['workflow'],
						operation: ['submitWorkflowTask'],
					},
				},
			},
			{
				displayName: 'Comment',
				name: 'comment',
				type: 'string',
				description: 'Approval comment',
				default: '',
				displayOptions: {
					show: {
						resource: ['workflow'],
						operation: ['submitWorkflowTask'],
					},
				},
			},
		],
	};

	methods = {
		loadOptions: {
			// 获取所有 fields
			async getFieldOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentialData = await this.getCredentials('jiandaoyunApi');
				const baseURL = credentialData.server as string | undefined;
				const appId = this.getCurrentNodeParameter('appId') as string;
				const entryId = this.getCurrentNodeParameter('entryId') as string;
				const returnData: INodePropertyOptions[] = [];

				// todo: 封装成 API Call
				const responseData = await this.helpers.requestWithAuthentication.call(
					this,
					'jiandaoyunApi',
					{
						baseURL,
						method: 'POST',
						url: '/api/v5/app/entry/widget/list',
						json: true,
						body: {
							app_id: appId,
							entry_id: entryId,
						},
					},
				);
				const widgets = responseData?.widgets ?? [];
				const sysWidgets = responseData?.sysWidgets ?? [];

				for (const widget of _.concat(widgets, sysWidgets)) {
					const widgetName = widget?.name ?? '';
					const label = widget?.label ?? '';
					let name = '';
					if (label) {
						name = `${label} (${widgetName})`;
					} else {
						name = widgetName;
					}
					returnData.push({
						name,
						value: widgetName,
					});
				}

				return returnData;
			},
		},
		listSearch: {},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const operation = this.getNodeParameter('operation', 0);
		const resource = this.getNodeParameter('resource', 0);
		const fullOperation = `${resource}:${operation}`;
		const credentialData = await this.getCredentials('jiandaoyunApi');
		let baseURL = credentialData.server as string | undefined;
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const overwriteData = !['TODO 黑名单'].includes(fullOperation);

		// For Post
		let body: IDataObject;
		// For Query string
		let qs: IDataObject;

		let requestMethod: IHttpRequestMethods;
		let endpoint: string;
		let log: any = {};

		for (let i = 0; i < items.length; i++) {
			try {
				// Reset all values
				requestMethod = 'POST';
				endpoint = '';
				body = {};
				qs = {};
				log = {};

				const appId = this.getNodeParameter('appId', i, '') as string;
				const entryId = this.getNodeParameter('entryId', i, '') as string;
				const skip = this.getNodeParameter('skipCount', i, 0) as number;
				const limit = this.getNodeParameter('returnCount', i, 100) as number;
				const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

				if (resource === 'entry') {
					if (operation === 'getFields') {
						if (operation === 'getFields') {
							endpoint = '/api/v5/app/entry/widget/list';
							body = {
								app_id: appId,
								entry_id: entryId,
							};
						}
					}
				} else if (resource === 'app') {
					if (operation === 'getApps') {
						endpoint = '/api/v5/app/list';
						body = {
							skip,
							limit,
						};
					} else if (operation === 'getEntries') {
						endpoint = '/api/v5/app/entry/list';
						body = {
							app_id: appId,
							skip,
							limit,
						};
					} else {
						throw new NodeOperationError(this.getNode(), 'Not implemented yet');
					}
				} else if (resource === 'data') {
					if (operation === 'getSingleDataRecord') {
						const dataId = this.getNodeParameter('dataId', i, '') as string;
						endpoint = '/api/v5/app/entry/data/get';
						body = {
							app_id: appId,
							entry_id: entryId,
							data_id: dataId,
						};
					} else if (operation === 'getManyDataRecords') {
						const dataId = additionalFields?.dataId;
						const fields = additionalFields?.fields;
						const filter = additionalFields?.filter as string | undefined;
						endpoint = '/api/v5/app/entry/data/list';
						body = {
							app_id: appId,
							entry_id: entryId,
							data_id: dataId,
							fields,
							filter: filter ? JSON.parse(filter) : { rel: 'and', cond: [] },
							limit,
						};
					} else if (operation === 'createDataRecord') {
						body = {
							app_id: appId,
							entry_id: entryId,
						};
						const usingJson = this.getNodeParameter('usingJson', i, true) as boolean;
						if (usingJson) {
							const dataRecordJson = this.getNodeParameter('dataRecordJson', i, '') as string;
							body.data = JSON.parse(dataRecordJson);
						} else {
							throw new NodeOperationError(this.getNode(), 'Not implemented yet');
						}
						const dataCreator = additionalFields?.dataCreator;
						const isStartWorkflow = additionalFields?.isStartWorkflow;
						const isStartTrigger = additionalFields?.isStartTrigger;
						const transactionId = additionalFields?.transactionId;
						endpoint = '/api/v5/app/entry/data/create';
						if (!_.isNil(dataCreator)) {
							body.data_creator = dataCreator;
						}
						if (!_.isNil(isStartWorkflow)) {
							body.is_start_workflow = isStartWorkflow;
						}
						if (!_.isNil(isStartTrigger)) {
							body.is_start_trigger = isStartTrigger;
						}
						if (!_.isNil(transactionId)) {
							body.transaction_id = transactionId;
						}
					} else if (operation === 'createManyDataRecords') {
						body = {
							app_id: appId,
							entry_id: entryId,
						};
						const dataRecordJson = this.getNodeParameter('dataRecordJson', i, '') as string;
						body.data_list = JSON.parse(dataRecordJson);
						if (!_.isArray(body.data_list)) {
							throw new NodeOperationError(this.getNode(), 'dataRecordJson must be an array', {
								itemIndex: i,
							});
						}
						const dataCreator = additionalFields?.dataCreator;
						const isStartWorkflow = additionalFields?.isStartWorkflow;
						const transactionId = additionalFields?.transactionId;
						endpoint = '/api/v5/app/entry/data/batch_create';
						if (!_.isNil(dataCreator)) {
							body.data_creator = dataCreator;
						}
						if (!_.isNil(isStartWorkflow)) {
							body.is_start_workflow = isStartWorkflow;
						}
						if (!_.isNil(transactionId)) {
							body.transaction_id = transactionId;
						}
					} else if (operation === 'updateDataRecord') {
						const dataId = this.getNodeParameter('dataId', i, '') as string;
						body = {
							app_id: appId,
							entry_id: entryId,
							data_id: dataId,
						};
						const usingJson = this.getNodeParameter('usingJson', i, true) as boolean;
						if (usingJson) {
							const dataRecordJson = this.getNodeParameter('dataRecordJson', i, '') as string;
							body.data = JSON.parse(dataRecordJson);
						} else {
							throw new NodeOperationError(this.getNode(), 'Not implemented yet');
						}
						const isStartTrigger = additionalFields?.isStartTrigger;
						const transactionId = additionalFields?.transactionId;
						endpoint = '/api/v5/app/entry/data/update';
						if (!_.isNil(isStartTrigger)) {
							body.is_start_trigger = isStartTrigger;
						}
						if (!_.isNil(transactionId)) {
							body.transaction_id = transactionId;
						}
					} else if (operation === 'updateManyDataRecords') {
						const dataRecordIdsJson = this.getNodeParameter('dataRecordIdsJson', i, '') as string;
						body = {
							app_id: appId,
							entry_id: entryId,
							data_ids: JSON.parse(dataRecordIdsJson),
						};
						if (!_.isArray(body.data_ids)) {
							throw new NodeOperationError(this.getNode(), 'dataRecordIdsJson must be an array', {
								itemIndex: i,
							});
						}
						const usingJson = this.getNodeParameter('usingJson', i, true) as boolean;
						if (usingJson) {
							const dataRecordJson = this.getNodeParameter('dataRecordJson', i, '') as string;
							body.data = JSON.parse(dataRecordJson);
						} else {
							throw new NodeOperationError(this.getNode(), 'Not implemented yet');
						}
						const transactionId = additionalFields?.transactionId;
						endpoint = '/api/v5/app/entry/data/batch_update';
						if (!_.isNil(transactionId)) {
							body.transaction_id = transactionId;
						}
					} else if (operation === 'deleteDataRecord') {
						const dataId = this.getNodeParameter('dataId', i, '') as string;
						body = {
							app_id: appId,
							entry_id: entryId,
							data_id: dataId,
						};
						const isStartTrigger = additionalFields?.isStartTrigger;
						endpoint = '/api/v5/app/entry/data/delete';
						if (!_.isNil(isStartTrigger)) {
							body.is_start_trigger = isStartTrigger;
						}
					} else if (operation === 'deleteManyDataRecord') {
						const dataRecordIdsJson = this.getNodeParameter('dataRecordIdsJson', i, '') as string;
						body = {
							app_id: appId,
							entry_id: entryId,
							data_ids: JSON.parse(dataRecordIdsJson),
						};
						if (!_.isArray(body.data_ids)) {
							throw new NodeOperationError(this.getNode(), 'dataRecordIdsJson must be an array', {
								itemIndex: i,
							});
						}
						endpoint = '/api/v5/app/entry/data/batch_delete';
					} else {
						throw new NodeOperationError(this.getNode(), 'Not implemented yet');
					}
				} else if (resource === 'file') {
					if (operation === 'getUploadToken') {
						const transactionId = this.getNodeParameter('transactionId', i, '') as string;
						endpoint = '/api/v5/app/entry/file/get_upload_token';
						body = {
							app_id: appId,
							entry_id: entryId,
							transaction_id: transactionId,
						};
					} else if (operation === 'uploadFile') {
						baseURL = this.getNodeParameter('url', i, undefined) as string;
						const token = this.getNodeParameter('token', i, '') as string;

						// TODO: 从其他节点里抄的代码，需要验证下
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, '') as string;
						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						let uploadData: Buffer | Awaited<ReturnType<typeof this.helpers.getBinaryStream>>;
						const itemBinaryData = items[i].binary![binaryPropertyName];
						if (itemBinaryData?.id) {
							uploadData = await this.helpers.getBinaryStream(itemBinaryData.id);
						} else {
							uploadData = Buffer.from(binaryData.data, BINARY_ENCODING);
						}
						endpoint = '/';
						body = {
							token,
							file: {
								value: uploadData,
								options: {
									filename: binaryData.fileName,
									contentType: binaryData.mimeType,
								},
							},
						};
					} else {
						throw new NodeOperationError(this.getNode(), 'Not implemented yet');
					}
				} else if (resource === 'workflow') {
					if (operation === 'getApprovalComments') {
						// const dataId = this.getNodeParameter('dataId', i, '') as string;
						// endpoint = `/api/v1/app/${appId}/entry/${entryId}/data/${dataId}/approval_comments`;
						throw new NodeOperationError(this.getNode(), 'Not implemented yet', {
							itemIndex: i,
						});
					} else if (operation === 'getWorkflowInstance') {
						const instanceId = this.getNodeParameter('instanceId', i, '') as string;
						const returnTasks = this.getNodeParameter('returnTasks', i, false) as boolean;
						endpoint = `/api/v6/workflow/instance/get`;
						body = {
							app_id: appId,
							entry_id: entryId,
							instance_id: instanceId,
							tasks_type: returnTasks ? 1 : 0,
						};
					} else if (operation === 'getWorkflowTasks') {
						endpoint = '/api/v5/workflow/task/list';
						const username = this.getNodeParameter('username', i, '') as string;
						body = {
							username,
							skip,
							limit,
						};
					} else if (operation === 'submitWorkflowTask') {
						const username = this.getNodeParameter('username', i, '') as string;
						const instanceId = this.getNodeParameter('instanceId', i, '') as string;
						const taskId = this.getNodeParameter('taskId', i, '') as string;
						const comment = this.getNodeParameter('comment', i, '') as string;
						endpoint = '/api/v1/workflow/task/approve';
						body = {
							username,
							instance_id: instanceId,
							task_id: taskId,
							...(_.isEmpty(comment) ? {} : { comment }),
						};
					} else {
						throw new NodeOperationError(this.getNode(), 'Not implemented yet');
					}
				} else {
					throw new NodeOperationError(this.getNode(), 'Not implemented yet');
				}

				// Make request
				const options: IRequestOptions = {
					baseURL,
					method: requestMethod,
					qs,
					body,
					url: endpoint,
					json: true,
				};
				if (['file:uploadFile'].includes(fullOperation)) {
					options.headers = {
						'Content-Type': 'multipart/form-data',
					};
					options.formData = body;
				}
				log.options = options;
				const responseData = await this.helpers.requestWithAuthentication.call(
					this,
					'jiandaoyunApi',
					options,
				);
				if (overwriteData) {
					const executionData = this.helpers.constructExecutionMetaData(
						// this.helpers.returnJsonArray(_.assign(responseData, { log })),
						this.helpers.returnJsonArray(responseData),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					if (overwriteData) {
						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray({
								error: error.message,
								// debug: { stack1: JSON.stringify(error?.stack) },
								// stack2: JSON.stringify(error?.cause?.stack),
							}),
							{ itemData: { item: i } },
						);
						returnData.push(...executionData);
					} else {
						items[i].json = {
							error: error.message,
							// debug: { error: JSON.stringify(error) },
						};
					}
					continue;
				}
				throw error;
			}
		}

		if (overwriteData) {
			return [returnData];
		} else {
			return [items];
		}
	}
}
