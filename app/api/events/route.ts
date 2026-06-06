import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";
import {v2 as cloudinary} from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
    try{
        await connectDB();

        const formData = await req.formData();

        let event;

        try{
            event = Object.fromEntries(formData.entries());
        }catch(e){
            return NextResponse.json({message: 'Invalid json data format'}, {status: 400})
        }

        const file = formData.get('image') as File;
        if(!file){
            return NextResponse.json({message: 'Image file is required'}, {status: 400})
        }

        let tags = JSON.parse(formData.get('tags') as string);
        let agenda = JSON.parse(formData.get('agenda') as string);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({resource_type: 'image', folder: 'DevEvent'}, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            }).end(buffer);
        });

        event.image = (uploadResult as { secure_url: string }).secure_url;
        // Parse array fields from FormData strings
        if (typeof event.agenda === 'string') {
        event.agenda = JSON.parse(event.agenda);
        }
        if (typeof event.tags === 'string') {
        event.tags = JSON.parse(event.tags);
        }

        const createdEvent = await Event.create({
            ...event,
            tags: tags,
            agenda: agenda,
        });

        return NextResponse.json({message: "Event created successfully", event: createdEvent}, {status: 201});
    } catch(e) {
        console.error('Full error:', JSON.stringify(e, null, 2));
        return NextResponse.json(
            { message: 'Event Creation Failed', error: JSON.stringify(e) },
            { status: 500 }
        );
    }
}

export async function GET() {
    try{
        await connectDB();

        const events = await Event.find().sort({ createdAt: -1 });
        return NextResponse.json({ message: 'Events fetched successfully', events });
    }
    catch(e){
        return NextResponse.json({message: 'Failed to fetch events', error: JSON.stringify(e)}, {status: 500})
    }

}

// a route that accepts a slug as input -> returns the event details
