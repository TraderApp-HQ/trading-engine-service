import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

interface RequestOptions extends AxiosRequestConfig {
	retry?: boolean;
}

interface IRequestInput {
	url?: string;
	options?: RequestOptions;
}

interface IRequestInputWithData extends IRequestInput {
	data: any;
}

export class APIClient {
	private readonly axiosInstance: AxiosInstance;
	private readonly url: string;

	constructor(baseURL: string) {
		this.axiosInstance = axios.create({ baseURL });
		this.url = baseURL;
	}

	async post<T>({ url, options, data }: IRequestInputWithData): Promise<T> {
		return this.request<T>({ method: "post", url: url ?? this.url, data, ...options });
	}

	async get<T>({ url, options }: IRequestInput): Promise<T> {
		return this.request<T>({ method: "get", url: url ?? this.url, ...options });
	}

	async put<T>({ url, options, data }: IRequestInputWithData): Promise<T> {
		return this.request<T>({ method: "put", url: url ?? this.url, data, ...options });
	}

	async patch<T>({ url, options, data }: IRequestInputWithData): Promise<T> {
		return this.request<T>({ method: "patch", url: url ?? this.url, data, ...options });
	}

	async delete<T>({ url, options }: IRequestInput): Promise<T> {
		return this.request<T>({ method: "delete", url: url ?? this.url, ...options });
	}

	private async request<T>(options: RequestOptions): Promise<T> {
		try {
			const response: AxiosResponse = await this.axiosInstance.request<T>(options);
			return response.data as T;
		} catch (error: any) {
			if (options.retry && error.response?.status >= 500) {
				await this.delay(5000); // 5 seconds delay
				return this.request<T>({ ...options, retry: false });
			}
			throw error;
		}
	}

	private async delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
