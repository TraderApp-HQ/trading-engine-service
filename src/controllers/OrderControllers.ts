import { Request, Response, NextFunction } from "express";

export async function getOrders(req: Request, res: Response, next: NextFunction) {
	try {
		res.status(200).json("Get orders controller working");
	} catch (error: any) {
		next(error);
	}
}

export async function getOrder(req: Request, res: Response, next: NextFunction) {
	const { id } = req.params;

	try {
		res.status(200).json("Get order controller working: " + id);
	} catch (error: any) {
		next(error);
	}
}

export async function placeOrder(req: Request, res: Response, next: NextFunction) {
	const { payload } = req.body;

	try {
		res.status(200).json({ payload });
	} catch (error: any) {
		next(error);
	}
}

export async function cancelOrder(req: Request, res: Response, next: NextFunction) {
	const { id } = req.params;

	try {
		res.status(200).json("Cancel order controller working: " + id);
	} catch (error: any) {
		next(error);
	}
}
