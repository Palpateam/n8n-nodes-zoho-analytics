import {
	ILoadOptionsFunctions,
	INodePropertyOptions,
	IExecuteFunctions,
} from 'n8n-workflow';

const VALID_ENVIRONMENTS = ['eu', 'com', 'com.au', 'com.cn', 'in', 'jp'];

export async function zohoApiRequest(
	this: ILoadOptionsFunctions | IExecuteFunctions | any,
	method: string,
	endpoint: string,
	qs: any = {},
	body: any = {},
	orgId?: string,
	isFormData: boolean = false
): Promise<any> {
	const credentials = await this.getCredentials('zohoAnalyticsOAuth2Api');
	
	// Sanitize environment: trim, lowercase, and validate against known values
	let environment = (credentials.environment as string || '').trim().toLowerCase();
	if (!environment || !VALID_ENVIRONMENTS.includes(environment)) {
		console.warn(`[ZohoAnalytics] Invalid or missing environment value: "${credentials.environment}" — defaulting to "eu"`);
		environment = 'eu';
	}
	const apiDomain = `https://analyticsapi.zoho.${environment}`;

	const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
	const fullUrl = `${apiDomain}${path}`;

	// Pre-validate the URL to catch malformed URLs early with a descriptive error
	try {
		new URL(fullUrl);
	} catch (urlError) {
		console.error(`[ZohoAnalytics] URL validation failed. fullUrl="${fullUrl}", environment="${environment}", endpoint="${endpoint}"`);
		throw new Error(
			`Zoho Analytics: Invalid URL constructed: "${fullUrl}". ` +
			`Environment="${environment}", endpoint="${endpoint}". ` +
			`This usually means a required parameter (workspace ID, view ID) is empty or invalid.`
		);
	}

	// Debug logging (temporary — helps diagnose scheduled execution issues)
	console.log(`[ZohoAnalytics] ${method} ${fullUrl} | orgId=${orgId || '(none)'} | isFormData=${isFormData}`);

	const headers: any = {};
	if (orgId) {
		headers['ZANALYTICS-ORGID'] = String(orgId).trim();
	}

	if (isFormData) {
		// Manually construct multipart/form-data body
		// This is required because n8n's httpRequestWithAuthentication uses axios,
		// and passing a plain object as formData doesn't produce valid multipart encoding.
		const boundary = '----n8nZohoFormBoundary' + Date.now().toString(36);

		let multipartBody = '';
		for (const key of Object.keys(body)) {
			multipartBody += `--${boundary}\r\n`;
			multipartBody += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
			multipartBody += body[key] + '\r\n';
		}
		multipartBody += `--${boundary}--\r\n`;

		headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;

		const options: any = {
			method,
			qs,
			url: fullUrl,
			body: Buffer.from(multipartBody),
			headers,
			encoding: null,
			json: false,
		};

		try {
			const response = await this.helpers.httpRequestWithAuthentication.call(this, 'zohoAnalyticsOAuth2Api', options);
			if (typeof response === 'string') {
				return JSON.parse(response);
			}
			return response;
		} catch (error) {
			console.error(`[ZohoAnalytics] Request FAILED: ${method} ${fullUrl}`, error);
			throw error;
		}
	} else {
		const options: any = {
			method,
			qs,
			url: fullUrl,
			body,
			headers,
			json: true,
		};

		try {
			return await this.helpers.httpRequestWithAuthentication.call(this, 'zohoAnalyticsOAuth2Api', options);
		} catch (error) {
			console.error(`[ZohoAnalytics] Request FAILED: ${method} ${fullUrl}`, error);
			throw error;
		}
	}
}

export async function getOrganisations(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const response = await zohoApiRequest.call(this, 'GET', '/restapi/v2/orgs');
	const orgs = response?.data?.orgs || [];
	return orgs.map((org: any) => ({ name: org.orgName, value: org.orgId }));
}

export async function getWorkspaces(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const response = await zohoApiRequest.call(this, 'GET', '/restapi/v2/workspaces');
	const owned = response?.data?.ownedWorkspaces || [];
	const shared = response?.data?.sharedWorkspaces || [];
	const workspaces = [...owned, ...shared];
	return workspaces.map((ws: any) => ({ name: ws.workspaceName, value: ws.workspaceId }));
}

export async function getViews(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const workspaceIDRaw = this.getNodeParameter('workspace', '') as string | number || '';
	const workspaceID = String(workspaceIDRaw).trim();
	if (!workspaceID) return [];

	const organisationIDRaw = this.getNodeParameter('organisation', '') as string | number || '';
	const organisationID = String(organisationIDRaw).trim();
	const response = await zohoApiRequest.call(this, 'GET', `/restapi/v2/workspaces/${encodeURIComponent(workspaceID)}/views`, {}, {}, organisationID);
	const views = response?.data?.views || [];

	return views
		.filter((v: any) => v.viewType === 'Table')
		.map((view: any) => ({ name: view.viewName, value: view.viewId }));
}

export async function getColumns(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const viewIDRaw = this.getNodeParameter('view', '') as string | number || '';
	const viewID = String(viewIDRaw).trim();
	if (!viewID) return [];

	const organisationIDRaw = this.getNodeParameter('organisation', '') as string | number || '';
	const organisationID = String(organisationIDRaw).trim();
	const qs = { CONFIG: JSON.stringify({ withInvolvedMetaInfo: true }) };
	const response = await zohoApiRequest.call(this, 'GET', `/restapi/v2/views/${encodeURIComponent(viewID)}`, qs, {}, organisationID);

	const columns = response?.data?.views?.columns || [];
	return columns.map((col: any) => ({ name: col.columnName, value: col.columnName }));
}
