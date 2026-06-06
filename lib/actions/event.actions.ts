'use server';

import Event from "@/database/event.model";
import connectDB from "../mongodb";

export const getSimilarEventsBySlug = async(slug: string) =>{
    try{
        await connectDB();

        const event = await Event.findOne({slug});
        // If the event we're looking for has similar tags, it means they are similar events
        return await Event.find({ _id: {$ne: event._id}, tags: {$in: event.tags}}).lean(); // the object is moongose object, not js, so add .lean() so that it can spread properly
    }
    catch{
        return [];
    }
}