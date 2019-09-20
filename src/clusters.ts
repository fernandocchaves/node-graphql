import * as cluster from 'cluster';
import { CpuInfo, cpus } from 'os';

class Clusters {
    private cpus: CpuInfo[];

    constructor() {
        this.cpus = cpus();
        this.init();
    }

    init(): void {
        if(cluster.isMaster) {
            console.log('MASTER');
            this.cpus.forEach(() => cluster.fork());
            cluster.on('listening', (worker: cluster.Worker) => {
                console.log(`Cluster ${worker.process.pid} conected`);
            });

            cluster.on('disconnect', (worker: cluster.Worker) => {
                console.log(`Cluster ${worker.process.pid} disconected`);
            });

            cluster.on('exit', (worker: cluster.Worker) => {
                console.log(`Cluster ${worker.process.pid} exited`);
                cluster.fork();
            });

        } else {
            console.log('Worker...');
            require('./index');
        }
    }
}

export default new Clusters();