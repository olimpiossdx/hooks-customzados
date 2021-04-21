import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { INotification, IResponseError } from "./App";

export async function ApiServiceRequest<TViewModel = any>({ baseURL = 'http://localhost:3333', method = 'get', ...rest }: AxiosRequestConfig,
  setLoad: React.Dispatch<React.SetStateAction<boolean>>, setNotification: React.Dispatch<React.SetStateAction<INotification>>) {
  let counter = 0;
  const maxRetry = 2;
  setLoad(true);

  const api: AxiosInstance = axios.create({ baseURL });

  api.interceptors.request.use(function (config) {
    // Do something before request is sent
    return config;
  }, function (error) {
    // Do something with request error
    return Promise.reject(error);
  });

  // Add a response interceptor
  api.interceptors.response.use(function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  }, function (error: AxiosError) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    if (counter < maxRetry) {
      counter += 1;
      return new Promise((resolve) => resolve(api.request<TViewModel>({ ...rest, method })));
    };

    return Promise.reject(error);
  });

  let axiosResponse: AxiosResponse<TViewModel | IResponseError>;

  try {
    axiosResponse = await api.request<TViewModel>({ ...rest, method }) as AxiosResponse<TViewModel>;
  } catch (error) {

    axiosResponse = {
      data: { status: 'error', message: 'Ocorreu um erro, caso persista, contacte o suporte' },
      status: 500,
      statusText: 'Internal Server Error',
      headers: rest.headers,
      config: rest,
      request: rest,
    } as AxiosResponse<IResponseError>;


    if (error && axios.isAxiosError(error)) {
      if (error.response?.status !== 500) {
        axiosResponse = {
          ...axiosResponse,
          status: error.response?.status as number,
          data: error.response?.data,
        }
      }

      axiosResponse = {
        ...axiosResponse,
        status: error.response?.status as number,
        statusText: error.response?.statusText as string,
        headers: error.response?.headers as AxiosRequestConfig,
        config: error.response?.config as AxiosRequestConfig,
        request: error.response?.request,
      };

    }

    setLoad(false);
    setNotification({ open: true, status: 'error', message: (axiosResponse.data as IResponseError).message });
  }

  return axiosResponse.data;
};