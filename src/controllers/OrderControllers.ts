import { apiResponseHandler } from "@traderapp/shared-resources";
import { Request, Response, NextFunction } from "express";

export async function getOrders(req: Request, res: Response, next: NextFunction) {
	res.status(200).json(
		apiResponseHandler({
			message: "Get orders controller working",
		})
	);
}

export async function getOrder(req: Request, res: Response, next: NextFunction) {
	const { id } = req.params;

	try {
		res.status(200).json(
			apiResponseHandler({
				message: "Get orders controller working" + id,
			})
		);
	} catch (error: any) {
		next(error);
	}
}

export async function placeOrder(req: Request, res: Response, next: NextFunction) {
	const { payload } = req.body;

	try {
		res.status(200).json(
			apiResponseHandler({
				object: payload,
			})
		);
	} catch (error: any) {
		next(error);
	}
}

export async function cancelOrder(req: Request, res: Response, next: NextFunction) {
	const { id } = req.params;

	try {
		res.status(200).json(
			apiResponseHandler({
				message: "Cancel order controller working: " + id,
			})
		);
	} catch (error: any) {
		next(error);
	}
}
