export default function Dashboard() {
    return (
        <div className="flex p-6 items-start border">
            <h1 className="text-3xl font-bold py-3 px-5">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-4xl text-center">upload pdf</div>
                <div className="p-4 border rounded-4xl text-center">extraction results</div>
                <div className="p-4 border rounded-4xl text-center">export</div>
                <code>test code</code>
            </div>
        </div>
    );
}