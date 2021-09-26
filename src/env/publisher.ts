import EventTransport from '../transport/event';
import Publisher from '../classes/Publisher';

export default function createEnv(id?: string) {
    const env = new Publisher(id);

    // todo ????
    // @ts-ignore
    env.linkWindow = function (target) {
        EventTransport.get('rempl-env-publisher', 'rempl-env-subscriber', target).sync(env);
    };

    return env;
}
