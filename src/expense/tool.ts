import { Expense } from '../DatabaseSchema/index.js';
import * as z from "zod"
import { tool } from "langchain"
import { getCalendar } from '../store/tokenStore.js';




export function initTools(userId: string) {
    const addExpense = tool(
        async ({ title, amount, userId }) => {

            try {

                if (!title) {
                    return "You should provide a title for the expense."
                }
                if (!amount || isNaN(amount)) {
                    return "You should provide a valid amount for the expense."
                }
                if (!userId) {
                    return "User not authenticated."
                }
                console.log("expense", title, amount)
                const date = new Date().toISOString().split("T")[0]
                console.log("Data", date)

                await Expense.create({ title, amount, date: new Date(date), userId });
                return JSON.stringify({ success: true, message: "Expense added successfully." })
            } catch (error) {
                console.error("Error adding expense:", error)
                return JSON.stringify({ success: false, message: "Failed to add expense." })
            }


        },
        {
            name: "add_expense",
            description: "Add a new expense to Database",
            schema: z.object({
                title: z.string().describe("Title of the expense"),
                amount: z.number().describe("Amount of the expense"),
                userId: z.string().describe("User ID of the user"),
            }),
        }
    );
    const getExpensesData = tool(
        async ({ from, to, userId }) => {
            const expenses = await Expense.find({
                date: {
                    $gte: new Date(from),
                    $lte: new Date(to)
                },
                userId
            }).sort({ date: 1 });
            return JSON.stringify(expenses.map(exp => ({
                title: exp.title,
                amount: exp.amount,
                date: exp.date.toISOString().split('T')[0]
            })));
        },
        {
            name: "get_expenses",
            description: "Get expenses data from Database",
            schema: z.object({
                from: z.string().describe("Start Date in format YYYY-MM-DD"),
                to: z.string().describe("End Date in format YYYY-MM-DD"),
                userId: z.string().describe("User ID of the user"),
            }),
        }
    );
    const getExpensesDatabyGroupingChart = tool(
        async ({ from, to, groupBy, userId }) => {
            console.log("groupBy", groupBy)
            let groupFormat;
            switch (groupBy) {
                case "month":
                    groupFormat = {
                        $dateToString: {
                            format: "%Y-%m",
                            date: "$date"
                        }
                    };
                    break;
                case "day":
                    groupFormat = {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$date"
                        }
                    };
                    break;
                case "year":
                    groupFormat = {
                        $dateToString: {
                            format: "%Y",
                            date: "$date"
                        }
                    };
                    break;
                default:
                    groupFormat = {
                        $dateToString: {
                            format: "%Y-%m",
                            date: "$date"
                        }
                    };
            }
            console.log("groupFormat", groupFormat)
            const pipeline = [
                {
                    $match: {
                        date: {
                            $gte: new Date(from),
                            $lte: new Date(to)
                        },
                        userId
                    }
                },
                {
                    $group: {
                        _id: groupFormat,
                        total: { $sum: "$amount" }
                    }
                },
                {
                    $sort: { "_id": 1 }
                }
            ];
            const data = await Expense.aggregate(pipeline);
            console.log("Data from get expense", data)
            const result = data.map((row) => {
                return {
                    [groupBy]: row._id,
                    amount: row.total
                }
            })
            console.log("result by grouping", result)
            return JSON.stringify({
                type: 'chart',
                data: result,
                labelKey: groupBy
            })
        },
        {
            name: "get_expenses_by_grouping",
            description: "Get expenses data from Database grouped by a specific time period",
            schema: z.object({
                from: z.string().describe("Start Date in format YYYY-MM-DD"),
                to: z.string().describe("End Date in format YYYY-MM-DD"),
                groupBy: z.enum(["day", "month", "year"]).describe("Group the expenses by day, month, or year"),
                userId: z.string().describe("User ID of the user"),
            }),
        }
    );
    const createCalendarEvent = tool(
        async ({ title, startTime, endTime, attendees, location }: any) => {
            console.log("createCalendar event call", title, startTime, endTime, attendees, location);
            try {
                const calendar = await getCalendar(userId);

                const event = {
                    summary: title,
                    location: location,
                    start: {
                        dateTime: startTime,
                        timeZone: "Asia/Dhaka",
                    },
                    end: {
                        dateTime: endTime,
                        timeZone: "Asia/Dhaka",
                    },
                    attendees: (attendees ?? []).map((email: string) => ({ email })),
                };

                const response = await calendar.events.insert({
                    calendarId: "primary",
                    requestBody: event,
                });

                console.log("response", response.data);
                return `✅ Event created successfully!\nEvent Link: ${response.data.htmlLink}`;

            } catch (error: any) {
                console.error(error);
                return "❌ Failed to create event";
            }
        },
        {
            name: "create_calendar_event",
            description: "Create a calendar event. Requires exact ISO datetime format.",
            schema: z.object({
                title: z.string(),
                startTime: z.string().describe("ISO format: '2024-01-15T14:00:00'"),
                endTime: z.string().describe("ISO format: '2024-01-15T15:00:00'"),
                attendees: z.array(z.string().optional()).describe("email addresses"),
                location: z.string().optional(),
            }),
        }
    );

    const getAvailableTimeSlots = tool(
        async ({ attendees, date }) => {
            try {
                const calendar = await getCalendar(userId);

                const response = await calendar.freebusy.query({
                    requestBody: {
                        timeMin: `${date}T00:00:00Z`,
                        timeMax: `${date}T23:59:59Z`,
                        items: attendees.map((email) => ({ id: email })),
                    },
                });

                const busy =
                    response.data.calendars && attendees.length > 0
                        ? response.data.calendars[attendees[0]]?.busy || []
                        : [];

                if (busy.length === 0) return ["All day free ✅"];

                return busy.map((b: any) => `Busy from ${b.start} to ${b.end}`);

            } catch (error) {
                console.log(error);
                return ["Error checking calendar"];
            }
        },
        {
            name: "get_available_time_slots",
            description: "Check busy times for given attendees on a specific date.",
            schema: z.object({
                attendees: z.array(z.string()),
                date: z.string().describe("ISO format: '2026-02-15'"),
            }),
        }
    );
    return [
        addExpense,
        getExpensesData,
        getExpensesDatabyGroupingChart,
        getAvailableTimeSlots,
        createCalendarEvent
    ]
}
